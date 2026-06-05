import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()
router.use(verifyJWT, requireAdmin)

const challengeSchema = z.object({
  question:     z.string().min(5),
  sampleAnswer: z.string().min(2),
  keywords:     z.array(z.string()).min(1),
  xpReward:     z.number().int().min(1).optional(),
  isActive:     z.boolean().optional(),
})

// GET /api/admin/challenges
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const challenges = await prisma.dailyChallenge.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { attempts: true } } },
    })

    res.json({
      total: challenges.length,
      challenges: challenges.map((c) => ({
        id: c.id,
        question: c.question,
        sampleAnswer: c.sampleAnswer,
        keywords: c.keywords,
        xpReward: c.xpReward,
        isActive: c.isActive,
        orderIndex: c.orderIndex,
        attemptCount: c._count.attempts,
        createdAt: c.createdAt,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/challenges
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = challengeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }
  try {
    const max = await prisma.dailyChallenge.aggregate({ _max: { orderIndex: true } })
    const nextOrder = (max._max.orderIndex ?? 0) + 1

    const challenge = await prisma.dailyChallenge.create({
      data: {
        question:     parsed.data.question,
        sampleAnswer: parsed.data.sampleAnswer,
        keywords:     parsed.data.keywords,
        xpReward:     parsed.data.xpReward ?? 10,
        isActive:     parsed.data.isActive ?? true,
        orderIndex:   nextOrder,
      },
    })
    res.status(201).json({ message: 'Challenge created.', challenge })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/challenges/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = challengeSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }
  try {
    const challenge = await prisma.dailyChallenge.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json({ message: 'Challenge updated.', challenge })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Challenge not found', code: 'NOT_FOUND' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/challenges/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.dailyChallenge.delete({ where: { id: req.params.id } })
    res.json({ message: 'Challenge deleted.' })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Challenge not found', code: 'NOT_FOUND' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
