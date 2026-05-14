import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

const moduleUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/admin/modules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { lessons: { select: { id: true } } },
    })

    const completionCounts = await prisma.moduleProgress.groupBy({
      by: ['moduleId'],
      where: { isCompleted: true },
      _count: { moduleId: true },
    })

    const countMap = new Map(completionCounts.map((c) => [c.moduleId, c._count.moduleId]))

    res.json({
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
        isPublished: m.isPublished,
        lessonCount: m.lessons.length,
        totalCompletions: countMap.get(m.id) ?? 0,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/modules/:moduleId
router.patch('/:moduleId', async (req: Request, res: Response): Promise<void> => {
  const parsed = moduleUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const module = await prisma.module.update({
      where: { id: req.params.moduleId },
      data: parsed.data,
    })

    res.json({ message: 'Module updated.', module })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
