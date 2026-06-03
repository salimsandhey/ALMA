import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/countries
router.get('/countries', async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } })
    res.json({ countries })
  } catch (err) {
    console.error('[GET /countries]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/languages
router.get('/languages', async (_req: Request, res: Response): Promise<void> => {
  try {
    const languages = await prisma.language.findMany({ orderBy: [{ orderIndex: 'asc' }, { label: 'asc' }] })
    res.json({ languages })
  } catch (err) {
    console.error('[GET /languages]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
