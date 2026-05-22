import { Router, Request, Response } from 'express'
import { verifyJWT } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
router.use(verifyJWT)

router.get('/songs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const songs = await prisma.song.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        emoji: true,
        youtubeUrl: true,
        lyrics: true,
        orderIndex: true,
      },
    })
    res.json({ songs })
  } catch {
    res.status(500).json({ error: 'Failed to fetch songs', code: 'INTERNAL_ERROR' })
  }
})

router.get('/songs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const song = await prisma.song.findFirst({
      where: { id: req.params.id, isPublished: true },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        emoji: true,
        youtubeUrl: true,
        lyrics: true,
        orderIndex: true,
      },
    })
    if (!song) {
      res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ song })
  } catch {
    res.status(500).json({ error: 'Failed to fetch song', code: 'INTERNAL_ERROR' })
  }
})

export default router
