import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()
router.use(verifyJWT, requireAdmin)

const youtubeUrl = z.string().url()
  .refine((u) => /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(u), { message: 'Must be a YouTube URL' })

const songSchema = z.object({
  title:       z.string().min(1).max(200),
  artist:      z.string().min(1).max(100),
  genre:       z.string().min(1).max(50),
  emoji:       z.string().min(1).max(10),
  youtubeUrl,
  lyrics:      z.array(z.string().max(500)).max(500),
  isPublished: z.boolean().optional(),
  orderIndex:  z.number().int().optional(),
})

// GET /api/admin/songs
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const songs = await prisma.song.findMany({ orderBy: { orderIndex: 'asc' } })
    res.json({ total: songs.length, songs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/songs
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = songSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }
  try {
    const max = await prisma.song.aggregate({ _max: { orderIndex: true } })
    const nextOrder = (max._max.orderIndex ?? 0) + 1

    const song = await prisma.song.create({
      data: { ...parsed.data, orderIndex: parsed.data.orderIndex ?? nextOrder },
    })
    res.status(201).json({ message: 'Song created.', song })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/songs/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = songSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }
  try {
    const song = await prisma.song.update({ where: { id: req.params.id }, data: parsed.data })
    res.json({ message: 'Song updated.', song })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/songs/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.song.delete({ where: { id: req.params.id } })
    res.json({ message: 'Song deleted.' })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
