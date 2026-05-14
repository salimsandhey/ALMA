import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

// GET /api/admin/students
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, status = 'all' } = req.query

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(100, Math.max(1, Number(limit)))
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

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, displayName: true, email: true,
          createdAt: true, lastActiveDate: true, xpTotal: true, isActive: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({ students, total, page: pageNum, limit: limitNum })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/students/:userId
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        userBadges: { include: { badge: true } },
        moduleProgress: {
          include: { module: { select: { title: true, lessons: { select: { id: true } } } } },
        },
      },
    })

    if (!user || user.role !== 'STUDENT') {
      res.status(404).json({ error: 'Student not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      age: user.age,
      gender: user.gender,
      nativeLanguage: user.nativeLanguage,
      xpTotal: user.xpTotal,
      streakCount: user.streakCount,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastActiveDate: user.lastActiveDate,
      badges: user.userBadges.map((ub) => ({ name: ub.badge.name, earnedAt: ub.earnedAt })),
      moduleProgress: user.moduleProgress.map((mp) => ({
        moduleTitle: mp.module.title,
        totalLessons: mp.module.lessons.length,
        isCompleted: mp.isCompleted,
      })),
    })
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
    await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: parsed.data.isActive },
    })

    res.json({ message: parsed.data.isActive ? 'Student account activated.' : 'Student account deactivated.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
