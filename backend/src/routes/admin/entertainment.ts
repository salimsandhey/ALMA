import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

const questionSchema = z.object({
  question: z.string().min(1),
  expectedAnswer: z.string().min(1),
  keywords: z.array(z.string()).default([]),
})

const httpsUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), { message: 'Only http/https URLs are allowed' })

const contentCreateSchema = z.object({
  type: z.enum(['VIDEO', 'ARTICLE']),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).default(''),
  url: httpsUrl,
  duration: z.string().optional(),
  xpReward: z.number().int().min(1).optional(),
  questions: z.array(questionSchema).max(3).optional(),
})

const contentUpdateSchema = contentCreateSchema.partial()

// GET /api/admin/entertainment
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.entertainmentContent.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    })
    res.json({ total: items.length, items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/entertainment
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = contentCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  try {
    const maxOrder = await prisma.entertainmentContent.aggregate({ _max: { orderIndex: true } })
    const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1

    const { questions, ...contentData } = parsed.data

    const item = await prisma.entertainmentContent.create({
      data: {
        ...contentData,
        orderIndex: nextOrder,
        xpReward: contentData.xpReward ?? 30,
        questions: questions && questions.length > 0
          ? {
              create: questions.map((q, i) => ({
                question: q.question,
                expectedAnswer: q.expectedAnswer,
                keywords: q.keywords,
                orderIndex: i + 1,
              })),
            }
          : undefined,
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    })

    res.status(201).json({ message: 'Content created.', item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/entertainment/:contentId
router.patch('/:contentId', async (req: Request, res: Response): Promise<void> => {
  const parsed = contentUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const { questions, ...contentData } = parsed.data
    const contentId = req.params.contentId

    await prisma.$transaction(async (tx) => {
      await tx.entertainmentContent.update({ where: { id: contentId }, data: contentData })
      if (questions !== undefined) {
        await tx.entertainmentQuestion.deleteMany({ where: { contentId } })
        if (questions.length > 0) {
          await tx.entertainmentQuestion.createMany({
            data: questions.map((q, i) => ({
              contentId,
              question: q.question,
              expectedAnswer: q.expectedAnswer,
              keywords: q.keywords,
              orderIndex: i + 1,
            })),
          })
        }
      }
    })

    const updated = await prisma.entertainmentContent.findUnique({
      where: { id: contentId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    })

    res.json({ message: 'Content updated.', item: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/entertainment/:contentId
router.delete('/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.entertainmentContent.delete({ where: { id: req.params.contentId } })
    res.json({ message: 'Content deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
