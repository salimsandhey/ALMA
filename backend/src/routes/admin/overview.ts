import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

// GET /api/admin/overview
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totalStudents, activeToday, activeThisWeek, lessonsCompletedThisWeek] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isEmailVerified: true } }),
      prisma.user.count({ where: { role: 'STUDENT', isEmailVerified: true, lastActiveDate: { gte: todayStart } } }),
      prisma.user.count({ where: { role: 'STUDENT', isEmailVerified: true, lastActiveDate: { gte: oneWeekAgo } } }),
      prisma.lessonProgress.count({ where: { isCompleted: true, completedAt: { gte: oneWeekAgo } } }),
    ])

    // Avg completion: per student, % of total lessons they completed
    const totalLessons = await prisma.lesson.count()
    let avgCompletion = 0
    if (totalStudents > 0 && totalLessons > 0) {
      const completedCount = await prisma.lessonProgress.count({ where: { isCompleted: true } })
      avgCompletion = Math.min(100, Math.round((completedCount / (totalStudents * totalLessons)) * 100))
    }

    // Needs help: inactive students with < 20% completion
    const allStudents = await prisma.user.findMany({
      where: { role: 'STUDENT', isEmailVerified: true },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        lastActiveDate: true,
        lessonProgress: { where: { isCompleted: true }, select: { id: true } },
      },
    })

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const needsHelpStudents = allStudents
      .filter((s) => !s.lastActiveDate || s.lastActiveDate < fourteenDaysAgo)
      .map((s) => {
        const completionPct = totalLessons > 0 ? Math.round((s.lessonProgress.length / totalLessons) * 100) : 0
        return {
          id: s.id,
          displayName: s.displayName,
          avatarUrl: s.avatarUrl,
          isActive: s.isActive,
          completionPct,
          lastActiveDate: s.lastActiveDate,
        }
      })

    // Module completion rates
    const modules = await prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: { lessons: { select: { id: true } } },
    })

    const moduleCompletionRates = await Promise.all(
      modules.map(async (m) => {
        if (totalStudents === 0 || m.lessons.length === 0) {
          return { id: m.id, title: m.title, imageUrl: m.imageUrl, completionPct: 0 }
        }
        const completed = await prisma.lessonProgress.count({
          where: { lessonId: { in: m.lessons.map((l) => l.id) }, isCompleted: true },
        })
        const completionPct = Math.min(100, Math.round((completed / (totalStudents * m.lessons.length)) * 100))
        return { id: m.id, title: m.title, imageUrl: m.imageUrl, completionPct }
      }),
    )

    // Most popular module
    const mostPopularRaw = await prisma.moduleProgress.groupBy({
      by: ['moduleId'],
      where: { isCompleted: true },
      _count: { moduleId: true },
      orderBy: { _count: { moduleId: 'desc' } },
      take: 1,
    })
    let mostPopularModule = null
    if (mostPopularRaw.length > 0) {
      const mod = await prisma.module.findUnique({ where: { id: mostPopularRaw[0].moduleId } })
      mostPopularModule = mod
        ? { id: mod.id, title: mod.title, completionCount: mostPopularRaw[0]._count.moduleId }
        : null
    }

    // Recent activity
    const recentActivity = await prisma.lessonProgress.findMany({
      where: { isCompleted: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        user: { select: { displayName: true } },
        lesson: { select: { title: true } },
      },
    })

    res.json({
      totalStudents,
      activeToday,
      activeThisWeek,
      avgCompletion,
      needsHelpCount: needsHelpStudents.length,
      needsHelpStudents,
      lessonsCompletedThisWeek,
      mostPopularModule,
      moduleCompletionRates,
      recentActivity: recentActivity.map((a) => ({
        userId: a.userId,
        displayName: a.user.displayName,
        action: `Completed lesson: ${a.lesson.title}`,
        timestamp: a.completedAt,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/overview/report  — returns master CSV
router.get('/report', async (_req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isEmailVerified: true },
      orderBy: { xpTotal: 'desc' },
      select: {
        displayName: true, email: true, country: true, nativeLanguage: true,
        xpTotal: true, streakCount: true, isActive: true, createdAt: true, lastActiveDate: true,
        lessonProgress: { where: { isCompleted: true }, select: { id: true, xpEarned: true } },
        moduleProgress: {
          select: { isCompleted: true, module: { select: { title: true } } },
        },
        userBadges: { include: { badge: { select: { name: true } } } },
      },
    })

    const totalLessons = await prisma.lesson.count()

    const rows = students.map((s) => {
      const completionPct = totalLessons > 0 ? Math.round((s.lessonProgress.length / totalLessons) * 100) : 0
      const completedModules = s.moduleProgress.filter((mp) => mp.isCompleted).length
      const badges = s.userBadges.map((ub) => ub.badge.name).join(' | ')
      return [
        `"${s.displayName ?? ''}"`,
        `"${s.email}"`,
        `"${s.country ?? ''}"`,
        `"${s.nativeLanguage ?? ''}"`,
        s.xpTotal,
        s.streakCount,
        `${completionPct}%`,
        `${completedModules}/${s.moduleProgress.length}`,
        s.isActive ? 'Active' : 'Inactive',
        `"${s.createdAt.toISOString().split('T')[0]}"`,
        `"${s.lastActiveDate ? s.lastActiveDate.toISOString().split('T')[0] : 'Never'}"`,
        `"${badges}"`,
      ].join(',')
    })

    const header = 'Name,Email,Country,Language,XP,Streak,Completion,Modules Done,Status,Joined,Last Active,Badges'
    const csv = [header, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="alma-master-report.csv"')
    res.send(csv)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
