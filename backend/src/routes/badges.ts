import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

// GET /api/badges
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const allBadges = await prisma.badge.findMany({ orderBy: { createdAt: 'asc' } })
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    })

    const earnedIds = new Map(earnedBadges.map((ub) => [ub.badgeId, ub.earnedAt]))

    const badges = allBadges.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      condition: b.condition,
      earned: earnedIds.has(b.id),
      earnedAt: earnedIds.get(b.id) ?? null,
    }))

    res.json({ badges })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
