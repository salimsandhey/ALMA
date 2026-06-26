import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'
import { awardXP, updateStreak } from '../services/xpService'
import { checkAndAwardBadges } from '../services/badgeService'

const router = Router()

router.use(verifyJWT)

const completeLessonSchema = z.object({
  lessonId: z.string(),
  xpEarned: z.number().int().min(0).optional(), // kept for compatibility, server recalculates
  cardResults: z.array(z.object({
    cardId: z.string().optional(),
    correct: z.boolean(),
    helpUsed: z.boolean().optional(),
  })).optional(),
})

// POST /api/progress/lesson/complete
router.post('/lesson/complete', async (req: Request, res: Response): Promise<void> => {
  const parsed = completeLessonSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { lessonId, cardResults } = parsed.data
  const userId = req.user!.userId

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { moduleId: true, xpReward: true },
    })

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' })
      return
    }

    // Server-side XP calculation: each correct card earns (xpReward / totalCards),
    // halved if the student used Help on that card.
    const totalCards = cardResults?.length ?? 0
    const correctCount = cardResults?.filter(r => r.correct).length ?? 0
    const xpPerCard = totalCards > 0 ? lesson.xpReward / totalCards : 0
    const calculatedXp = totalCards > 0
      ? Math.round(
          (cardResults ?? []).reduce((sum, r) => {
            if (!r.correct) return sum
            return sum + (r.helpUsed ? xpPerCard / 2 : xpPerCard)
          }, 0)
        )
      : 0
    const hasPerfectLessonScore = totalCards > 0 && correctCount === totalCards

    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    const isFirstCompletion = !existing?.isCompleted

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId, lessonId,
        isCompleted: true,
        xpEarned: isFirstCompletion ? calculatedXp : 0,
        attemptCount: 1,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        xpEarned: isFirstCompletion ? calculatedXp : existing?.xpEarned ?? 0,
        attemptCount: { increment: 1 },
        completedAt: new Date(),
      },
    })

    let newXpTotal = 0
    if (isFirstCompletion) {
      newXpTotal = await awardXP(userId, calculatedXp)
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { xpTotal: true } })
      newXpTotal = user?.xpTotal ?? 0
    }

    const { streakCount: newStreakCount, dailyVisitBonus } = await updateStreak(userId)
    if (dailyVisitBonus) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { xpTotal: true } })
      newXpTotal = user?.xpTotal ?? newXpTotal
    }

    // Check if module is now fully complete
    const module = await prisma.module.findUnique({
      where: { id: lesson.moduleId },
      include: { lessons: { select: { id: true } } },
    })

    let moduleCompleted = false
    let hasModuleWithAllPerfect = false
    if (module) {
      const completedCount = await prisma.lessonProgress.count({
        where: { userId, lessonId: { in: module.lessons.map((l) => l.id) }, isCompleted: true },
      })

      if (completedCount === module.lessons.length) {
        const existingModProgress = await prisma.moduleProgress.findUnique({
          where: { userId_moduleId: { userId, moduleId: lesson.moduleId } },
        })

        await prisma.moduleProgress.upsert({
          where: { userId_moduleId: { userId, moduleId: lesson.moduleId } },
          create: { userId, moduleId: lesson.moduleId, isCompleted: true, completedAt: new Date() },
          update: { isCompleted: true, completedAt: new Date() },
        })

        moduleCompleted = true

        if (!existingModProgress?.isCompleted) {
          // Module completion bonus: 20 pts
          newXpTotal = await awardXP(userId, 20)
        }

        const moduleLessonProgress = await prisma.lessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: module.lessons.map((l) => l.id) },
            isCompleted: true,
          },
          include: {
            lesson: {
              select: {
                xpReward: true,
              },
            },
          },
        })

        hasModuleWithAllPerfect =
          moduleLessonProgress.length === module.lessons.length &&
          moduleLessonProgress.every((progress) => progress.xpEarned >= progress.lesson.xpReward)
      }
    }

    const badgesUnlocked = await checkAndAwardBadges(userId, {
      hasPerfectLessonScore,
      hasModuleWithAllPerfect,
    })

    res.json({
      xpEarned: isFirstCompletion ? calculatedXp : 0,
      isFirstCompletion,
      newXpTotal,
      streakUpdated: true,
      newStreakCount,
      dailyVisitBonus,
      moduleCompleted,
      badgesUnlocked,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/progress/home — single call for home dashboard
router.get('/home', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const [user, modules, lessonProgressRecords, leaderboard] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, xpTotal: true, streakCount: true },
      }),
      prisma.module.findMany({
        where: { isPublished: true },
        orderBy: { orderIndex: 'asc' },
        include: { lessons: { select: { id: true } } },
      }),
      prisma.lessonProgress.findMany({
        where: { userId, isCompleted: true },
        select: { lessonId: true },
      }),
      prisma.user.findMany({
        where: { role: 'STUDENT', isActive: true },
        orderBy: { xpTotal: 'desc' },
        take: 5,
        select: { id: true, displayName: true, xpTotal: true },
      }),
    ])

    const completedIds = new Set(lessonProgressRecords.map((p) => p.lessonId))
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const completedLessons = completedIds.size

    let continueLesson: { moduleTitle: string; lessonTitle: string; lessonId: string } | null = null
    for (const mod of modules) {
      const incomplete = mod.lessons.find((l) => !completedIds.has(l.id))
      if (incomplete) {
        const lessonDetail = await prisma.lesson.findUnique({
          where: { id: incomplete.id },
          select: { title: true },
        })
        continueLesson = {
          moduleTitle: mod.title,
          lessonTitle: lessonDetail?.title ?? '',
          lessonId: incomplete.id,
        }
        break
      }
    }

    const leaderboardWithRank = leaderboard.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      displayName: u.displayName,
      xpTotal: u.xpTotal,
    }))

    const currentUserRank = leaderboardWithRank.findIndex((u) => u.userId === userId) + 1

    res.json({
      user,
      xpTotal: user?.xpTotal ?? 0,
      streakCount: user?.streakCount ?? 0,
      completedLessons,
      totalLessons,
      completionPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      continueLesson,
      topLearners: leaderboardWithRank,
      currentUserRank: currentUserRank || null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/progress/summary
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, streakCount: true },
    })

    const [completedLessons, completedModules, badgeCount] = await Promise.all([
      prisma.lessonProgress.count({ where: { userId, isCompleted: true } }),
      prisma.moduleProgress.count({ where: { userId, isCompleted: true } }),
      prisma.userBadge.count({ where: { userId } }),
    ])

    res.json({ xpTotal: user?.xpTotal ?? 0, streakCount: user?.streakCount ?? 0, completedLessons, completedModules, badgeCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/progress/music/complete — 10 pts per song
router.post('/music/complete', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId

  try {
    const newXpTotal = await awardXP(userId, 10)
    const { streakCount: newStreakCount, dailyVisitBonus } = await updateStreak(userId)
    const badgesUnlocked = await checkAndAwardBadges(userId)

    res.json({
      xpEarned: 10,
      newXpTotal,
      streakUpdated: true,
      newStreakCount,
      dailyVisitBonus,
      badgesUnlocked,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/progress/explore/view — 15 pts per content piece (first view only)
router.post('/explore/view', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ contentId: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { contentId } = parsed.data
  const feature = `explore_view_${contentId}`

  try {
    const alreadyViewed = await prisma.aIUsageLog.findFirst({
      where: { userId, feature },
    })

    if (alreadyViewed) {
      res.json({ xpEarned: 0, alreadyViewed: true })
      return
    }

    await prisma.aIUsageLog.create({ data: { userId, feature } })
    const newXpTotal = await awardXP(userId, 15)

    res.json({ xpEarned: 15, newXpTotal, alreadyViewed: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/progress/explore/question — 5 pts per correct answer
router.post('/explore/question', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ correct: z.boolean() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId

  try {
    if (!parsed.data.correct) {
      res.json({ xpEarned: 0 })
      return
    }

    const newXpTotal = await awardXP(userId, 5)
    res.json({ xpEarned: 5, newXpTotal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/progress/daily-challenge/question — 10 pts per question
router.post('/daily-challenge/question', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId

  try {
    const newXpTotal = await awardXP(userId, 10)
    res.json({ xpEarned: 10, newXpTotal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
