import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

function isInactive(lastActiveDate: Date | null) {
  return !lastActiveDate || lastActiveDate < new Date(Date.now() - FOURTEEN_DAYS_MS)
}

// GET /api/admin/students
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, status = 'all' } = req.query

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(50, Math.max(1, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const where: any = { role: 'STUDENT' }
    if (search) {
      where.OR = [
        { displayName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [totalLessons, students, total] = await Promise.all([
      prisma.lesson.count(),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          country: true,
          nativeLanguage: true,
          createdAt: true,
          lastActiveDate: true,
          xpTotal: true,
          streakCount: true,
          isActive: true,
          lessonProgress: { where: { isCompleted: true }, select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Batch-fetch country names for all country codes in this page
    const countryCodes = [...new Set(students.map((s) => s.country).filter(Boolean))] as string[]
    const countryRecords = countryCodes.length
      ? await prisma.country.findMany({ where: { code: { in: countryCodes } }, select: { code: true, name: true } })
      : []
    const countryNameMap = new Map(countryRecords.map((c) => [c.code, c.name]))

    const mapped = students.map((s) => {
      const completionPct = totalLessons > 0
        ? Math.round((s.lessonProgress.length / totalLessons) * 100)
        : 0
      return {
        id: s.id,
        displayName: s.displayName,
        email: s.email,
        avatarUrl: s.avatarUrl,
        countryCode: s.country,
        countryName: s.country ? (countryNameMap.get(s.country) ?? s.country) : null,
        nativeLanguage: s.nativeLanguage,
        createdAt: s.createdAt,
        lastActiveDate: s.lastActiveDate,
        xpTotal: s.xpTotal,
        streakCount: s.streakCount,
        isActive: s.isActive,
        completionPct,
      }
    })

    res.json({ students: mapped, total, page: pageNum, limit: limitNum, hasMore: skip + limitNum < total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/students/:userId
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalLessons, totalSongs, totalEntertainment, user] = await Promise.all([
      prisma.lesson.count(),
      prisma.song.count(),
      prisma.entertainmentContent.count(),
      prisma.user.findUnique({
        where: { id: req.params.userId },
        select: {
          id: true, displayName: true, email: true, avatarUrl: true,
          age: true, gender: true, country: true, nativeLanguage: true,
          xpTotal: true, streakCount: true, isActive: true, role: true,
          createdAt: true, lastActiveDate: true,
          userBadges: { include: { badge: { select: { name: true, description: true } } } },
          moduleProgress: {
            include: {
              module: { select: { title: true, imageUrl: true, lessons: { select: { id: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
          },
          lessonProgress: { where: { isCompleted: true }, select: { id: true, xpEarned: true } },
          entertainmentAttempts: { select: { id: true, score: true } },
        },
      }),
    ])

    if (!user || user.role !== 'STUDENT') {
      res.status(404).json({ error: 'Student not found', code: 'NOT_FOUND' })
      return
    }

    // Country + language names
    const [countryRecord, languageRecord] = await Promise.all([
      user.country ? prisma.country.findUnique({ where: { code: user.country }, select: { name: true } }) : null,
      user.nativeLanguage ? prisma.language.findUnique({ where: { code: user.nativeLanguage }, select: { label: true, flag: true } }) : null,
    ])

    const completionPct = totalLessons > 0
      ? Math.round((user.lessonProgress.length / totalLessons) * 100)
      : 0

    const avgScore = user.lessonProgress.length > 0
      ? Math.round((user.lessonProgress.reduce((s, lp) => s + lp.xpEarned, 0) / user.lessonProgress.length) * 10) / 10
      : 0

    const completedModules = user.moduleProgress.filter((mp) => mp.isCompleted).length

    // Modules in progress (not completed, has some lesson done)
    const currentModules = user.moduleProgress
      .filter((mp) => !mp.isCompleted)
      .map((mp) => mp.module.title)
      .slice(0, 3)

    res.json({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      age: user.age,
      gender: user.gender,
      countryCode: user.country,
      countryName: countryRecord?.name ?? user.country,
      languageCode: user.nativeLanguage,
      languageName: languageRecord?.label ?? user.nativeLanguage,
      languageFlag: languageRecord?.flag ?? null,
      xpTotal: user.xpTotal,
      streakCount: user.streakCount,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastActiveDate: user.lastActiveDate,
      completionPct,
      avgScore,
      completedModules,
      totalModules: user.moduleProgress.length,
      completedEntertainment: user.entertainmentAttempts.length,
      totalEntertainment,
      totalSongs,
      currentModules,
      needsHelp: isInactive(user.lastActiveDate),
      badges: user.userBadges.map((ub) => ({ name: ub.badge.name, description: ub.badge.description, earnedAt: ub.earnedAt })),
      moduleProgress: user.moduleProgress.map((mp) => ({
        moduleTitle: mp.module.title,
        totalLessons: mp.module.lessons.length,
        isCompleted: mp.isCompleted,
        completedAt: mp.completedAt,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/students/:userId/report  — individual student CSV
router.get('/:userId/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalLessons, user] = await Promise.all([
      prisma.lesson.count(),
      prisma.user.findUnique({
        where: { id: req.params.userId },
        include: {
          userBadges: { include: { badge: { select: { name: true } } } },
          moduleProgress: {
            include: { module: { select: { title: true } } },
          },
          lessonProgress: { where: { isCompleted: true }, select: { id: true, xpEarned: true } },
          entertainmentAttempts: { select: { id: true } },
        },
      }),
    ])

    if (!user || user.role !== 'STUDENT') {
      res.status(404).json({ error: 'Student not found' })
      return
    }

    const completionPct = totalLessons > 0
      ? Math.round((user.lessonProgress.length / totalLessons) * 100)
      : 0
    const completedModules = user.moduleProgress.filter((mp) => mp.isCompleted).length

    const lines = [
      `Student Report — ${user.displayName}`,
      `Generated,${new Date().toISOString().split('T')[0]}`,
      '',
      'CONTACT INFO',
      `Name,"${user.displayName}"`,
      `Email,"${user.email}"`,
      `Country,"${user.country ?? 'N/A'}"`,
      `Language,"${user.nativeLanguage ?? 'N/A'}"`,
      `Age,"${user.age ?? 'N/A'}"`,
      `Gender,"${user.gender ?? 'N/A'}"`,
      `Joined,"${user.createdAt.toISOString().split('T')[0]}"`,
      `Last Active,"${user.lastActiveDate ? user.lastActiveDate.toISOString().split('T')[0] : 'Never'}"`,
      `Status,"${user.isActive ? 'Active' : 'Inactive'}"`,
      '',
      'PERFORMANCE',
      `XP Total,${user.xpTotal}`,
      `Streak,${user.streakCount} days`,
      `Overall Completion,${completionPct}%`,
      `Lessons Completed,${user.lessonProgress.length}`,
      `Modules Completed,${completedModules} of ${user.moduleProgress.length}`,
      `Entertainment Completed,${user.entertainmentAttempts.length}`,
      '',
      'MODULE PROGRESS',
      'Module Title,Completed',
      ...user.moduleProgress.map((mp) => `"${mp.module.title}",${mp.isCompleted ? 'Yes' : 'No'}`),
      '',
      'BADGES EARNED',
      'Badge Name',
      ...user.userBadges.map((ub) => `"${ub.badge.name}"`),
    ]

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${user.displayName.replace(/\s+/g, '_')}-report.csv"`)
    res.send(lines.join('\n'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/students/:userId/status
router.patch('/:userId/status', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ isActive: z.boolean() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { role: true } })
    if (!target || target.role !== 'STUDENT') {
      res.status(404).json({ error: 'Student not found', code: 'NOT_FOUND' })
      return
    }
    await prisma.user.update({ where: { id: req.params.userId }, data: { isActive: parsed.data.isActive } })
    res.json({ message: parsed.data.isActive ? 'Student activated.' : 'Student deactivated.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
