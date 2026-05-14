import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

// GET /api/explore
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(50, Math.max(1, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const where: any = { isActive: true }
    if (category) where.category = category

    const [items, total] = await Promise.all([
      prisma.exploreContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.exploreContent.count({ where }),
    ])

    res.json({ items, total, page: pageNum, limit: limitNum })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
