import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

const BADGE_ORDER = [
  'First Steps',
  'First Conversation',
  'Hospitality Hero',
  'Word Wizard',
  'Quiz Master',
  'On Fire!',
  'Week Warrior',
  'Monthly Marvel',
  'Halfway There',
  'ALMA Graduate',
  'Perfect Score',
  'World Explorer',
] as const

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

    const orderedBadges = allBadges.sort((left, right) => {
      const leftIndex = BADGE_ORDER.indexOf(left.name as (typeof BADGE_ORDER)[number])
      const rightIndex = BADGE_ORDER.indexOf(right.name as (typeof BADGE_ORDER)[number])

      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    })

    const badges = orderedBadges.map((b) => ({
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
