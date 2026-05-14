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
  xpEarned: z.number().int().min(0),
  cardResults: z.array(z.object({
    cardId: z.string(),
    correct: z.boolean(),
  })).optional(),
})

// POST /api/progress/lesson/complete
router.post('/lesson/complete', async (req: Request, res: Response): Promise<void> => {
  const parsed = completeLessonSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { lessonId, xpEarned } = parsed.data
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

    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    const isFirstCompletion = !existing?.isCompleted

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId, lessonId,
        isCompleted: true,
        xpEarned: isFirstCompletion ? xpEarned : 0,
        attemptCount: 1,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        xpEarned: isFirstCompletion ? xpEarned : existing?.xpEarned ?? 0,
        attemptCount: { increment: 1 },
        completedAt: new Date(),
      },
    })

    let newXpTotal = 0
    if (isFirstCompletion) {
      newXpTotal = await awardXP(userId, xpEarned)
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { xpTotal: true } })
      newXpTotal = user?.xpTotal ?? 0
    }

    const newStreakCount = await updateStreak(userId)

    // Check if module is now fully complete
    const module = await prisma.module.findUnique({
      where: { id: lesson.moduleId },
      include: { lessons: { select: { id: true } } },
    })

    let moduleCompleted = false
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
          newXpTotal = await awardXP(userId, 50)
        }
      }
    }

    const badgesUnlocked = await checkAndAwardBadges(userId)

    res.json({ xpEarned: isFirstCompletion ? xpEarned : 0, newXpTotal, streakUpdated: true, newStreakCount, moduleCompleted, badgesUnlocked })
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

export default router
