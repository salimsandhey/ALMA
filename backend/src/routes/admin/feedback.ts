import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

// GET /api/admin/feedback
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
      },
    })

    const unansweredCount = items.filter((f) => !f.adminReply).length

    res.json({
      total: items.length,
      unansweredCount,
      items: items.map((f) => ({
        id: f.id,
        userId: f.userId,
        displayName: f.user.displayName,
        avatarUrl: f.user.avatarUrl,
        rating: f.rating,
        topic: f.topic,
        comment: f.comment,
        adminReply: f.adminReply,
        adminRepliedAt: f.adminRepliedAt,
        createdAt: f.createdAt,
        needsReply: !f.adminReply,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/feedback/:feedbackId/reply
router.post('/:feedbackId/reply', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ reply: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.feedbackId } })
    if (!feedback) {
      res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' })
      return
    }

    const updated = await prisma.feedback.update({
      where: { id: req.params.feedbackId },
      data: { adminReply: parsed.data.reply, adminRepliedAt: new Date() },
    })

    res.json({ message: 'Reply sent.', adminReply: updated.adminReply, adminRepliedAt: updated.adminRepliedAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/feedback/:feedbackId/reply
router.patch('/:feedbackId/reply', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ reply: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.feedbackId } })
    if (!feedback) {
      res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' })
      return
    }
    const updated = await prisma.feedback.update({
      where: { id: req.params.feedbackId },
      data: { adminReply: parsed.data.reply, adminRepliedAt: new Date() },
    })

    res.json({ message: 'Reply updated.', adminReply: updated.adminReply, adminRepliedAt: updated.adminRepliedAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
