import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

// GET /api/admin/overview
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totalStudents, activeStudentsThisWeek, lessonsCompletedThisWeek] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STUDENT', lastActiveDate: { gte: oneWeekAgo } } }),
      prisma.lessonProgress.count({ where: { isCompleted: true, completedAt: { gte: oneWeekAgo } } }),
    ])

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
      mostPopularModule = mod ? { id: mod.id, title: mod.title, completionCount: mostPopularRaw[0]._count.moduleId } : null
    }

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
      activeStudentsThisWeek,
      lessonsCompletedThisWeek,
      mostPopularModule,
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

export default router
