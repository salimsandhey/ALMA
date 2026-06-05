import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../legal'

const router = Router()
router.use(verifyJWT, requireAdmin)

const sectionSchema = z.object({
  title: z.string().min(1),
  body:  z.string().min(1),
})

const updateSchema = z.object({
  type:     z.enum(['terms', 'privacy']),
  sections: z.array(sectionSchema).min(1),
})

// GET /api/admin/legal — returns current content (with defaults if not set)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [termsRecord, privacyRecord] = await Promise.all([
      prisma.legalContent.findUnique({ where: { type: 'terms' } }),
      prisma.legalContent.findUnique({ where: { type: 'privacy' } }),
    ])

    res.json({
      terms: {
        sections:  (termsRecord?.sections as any[])   ?? DEFAULT_TERMS,
        updatedAt: termsRecord?.updatedAt              ?? null,
        isDefault: !termsRecord,
      },
      privacy: {
        sections:  (privacyRecord?.sections as any[])  ?? DEFAULT_PRIVACY,
        updatedAt: privacyRecord?.updatedAt             ?? null,
        isDefault: !privacyRecord,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PUT /api/admin/legal — upsert terms or privacy
router.put('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  try {
    const record = await prisma.legalContent.upsert({
      where:  { type: parsed.data.type },
      create: { type: parsed.data.type, sections: parsed.data.sections, updatedBy: req.user!.userId },
      update: { sections: parsed.data.sections, updatedBy: req.user!.userId },
    })

    res.json({ message: `${parsed.data.type === 'terms' ? 'Terms' : 'Privacy Policy'} updated.`, updatedAt: record.updatedAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/legal/reset — reset one type to defaults
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  const { type } = req.body as { type: 'terms' | 'privacy' }
  if (type !== 'terms' && type !== 'privacy') {
    res.status(400).json({ error: 'type must be terms or privacy', code: 'VALIDATION_ERROR' })
    return
  }
  try {
    await prisma.legalContent.deleteMany({ where: { type } })
    res.json({ message: `${type} reset to defaults.` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
