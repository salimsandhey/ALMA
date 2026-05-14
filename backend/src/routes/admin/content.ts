import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()

router.use(verifyJWT, requireAdmin)

const contentSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(1),
  category: z.enum(['PHRASE_OF_THE_DAY', 'GRAMMAR_TIP', 'CULTURE_NOTE', 'HOSPITALITY_FACT']),
})

const contentUpdateSchema = contentSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// GET /api/admin/content
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.exploreContent.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/content
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = contentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const item = await prisma.exploreContent.create({ data: parsed.data })
    res.status(201).json({ message: 'Content created.', item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/content/:contentId
router.patch('/:contentId', async (req: Request, res: Response): Promise<void> => {
  const parsed = contentUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const item = await prisma.exploreContent.update({
      where: { id: req.params.contentId },
      data: parsed.data,
    })
    res.json({ message: 'Content updated.', item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/content/:contentId
router.delete('/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.exploreContent.delete({ where: { id: req.params.contentId } })
    res.json({ message: 'Content deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
