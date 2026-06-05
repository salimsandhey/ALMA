import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'
import { evaluateAndAward } from '../services/badgeService'

const router = Router()

router.use(verifyJWT)

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  topic: z.string().max(50).optional(),
  comment: z.string().max(1000).optional(),
})

// GET /api/feedback — user's past submissions
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, topic: true, comment: true, createdAt: true, adminReply: true, adminRepliedAt: true },
    })
    const hasUnreadReply = feedbacks.some((f) => f.adminReply)
    res.json({ feedbacks, hasUnreadReply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/feedback
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = feedbackSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recent = await prisma.feedback.findFirst({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    })

    if (recent) {
      res.status(429).json({ error: 'You can only submit feedback once every 7 days', code: 'RATE_LIMITED' })
      return
    }

    await prisma.feedback.create({ data: { userId, ...parsed.data } })
    await evaluateAndAward(userId, 'submit_feedback')

    res.status(201).json({ message: 'Thank you for your feedback!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
