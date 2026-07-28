import { Router, Request, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'
import { uploadDefaultBgMusic } from '../../lib/cloudinary'

const router = Router()

router.use(verifyJWT, requireAdmin)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for audio
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true)
    else cb(new Error('Only audio files allowed'))
  },
})

const settingsSchema = z.object({
  coachDailyLimit:         z.number().int().min(1).max(500).optional(),
  greetingDailyLimit:      z.number().int().min(1).max(500).optional(),
  grammarDailyLimit:       z.number().int().min(1).max(500).optional(),
  warmupDailyLimit:        z.number().int().min(1).max(100).optional(),
  pronunciationDailyLimit: z.number().int().min(1).max(500).optional(),
  hintDailyLimit:          z.number().int().min(1).max(100).optional(),
  iosAppUrl:               z.string().url().optional().nullable(),
  androidAppUrl:           z.string().url().optional().nullable(),
})

// GET /api/admin/settings
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const row = await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        coachDailyLimit: 30,
        greetingDailyLimit: 20,
        grammarDailyLimit: 30,
        warmupDailyLimit: 3,
        pronunciationDailyLimit: 50,
        hintDailyLimit: 5,
      },
    })
    res.json(row)
  } catch {
    res.status(500).json({ error: 'Could not fetch settings', code: 'INTERNAL_ERROR' })
  }
})

// PUT /api/admin/settings
router.put('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = settingsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten(), code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const row = await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: parsed.data,
      create: { id: 'singleton', ...parsed.data },
    })
    // Bust the Redis cache so the new limits take effect within seconds
    await redis.del('app:settings')
    res.json(row)
  } catch {
    res.status(500).json({ error: 'Could not save settings', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/settings/default-bg-music — upload the fallback karaoke track
// used by any song that doesn't have its own custom background track
router.post('/default-bg-music', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided', code: 'NO_FILE' })
    return
  }
  try {
    const url = await uploadDefaultBgMusic(req.file.buffer)
    const name = req.file.originalname
    const row = await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: { defaultBgMusicUrl: url, defaultBgMusicName: name },
      create: { id: 'singleton', defaultBgMusicUrl: url, defaultBgMusicName: name },
    })
    await redis.del('app:settings')
    res.json({ defaultBgMusicUrl: row.defaultBgMusicUrl, defaultBgMusicName: row.defaultBgMusicName })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/settings/default-bg-music — revert to the built-in bundled track
router.delete('/default-bg-music', async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      update: { defaultBgMusicUrl: null, defaultBgMusicName: null },
      create: { id: 'singleton', defaultBgMusicUrl: null, defaultBgMusicName: null },
    })
    await redis.del('app:settings')
    res.json({ message: 'Default background music reset.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
