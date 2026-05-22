import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

// GET /api/leaderboard
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const limit = Math.min(Number(req.query.limit) || 50, 100)

    const users = await prisma.user.findMany({
      where: { isActive: true, role: 'STUDENT' },
      orderBy: { xpTotal: 'desc' },
      take: limit,
      select: { id: true, displayName: true, avatarUrl: true, xpTotal: true, country: true },
    })

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      xpTotal: u.xpTotal,
      country: u.country ?? null,
    }))

    const currentUserRank = leaderboard.findIndex((u) => u.userId === userId) + 1

    res.json({ leaderboard, currentUserRank: currentUserRank || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
