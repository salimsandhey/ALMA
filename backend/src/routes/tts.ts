import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth'
import { getOrGenerateTtsAudio } from '../lib/tts'

const router = Router()
router.use(verifyJWT)

const ttsSchema = z.object({
  text: z.string().min(1).max(1000),
  gender: z.enum(['male', 'female']),
})

// POST /api/tts
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = ttsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', code: 'VALIDATION_ERROR' })
    return
  }
  const { text, gender } = parsed.data

  try {
    const { audioUrlMale, audioUrlFemale } = await getOrGenerateTtsAudio(text)
    res.json({ audioUrl: gender === 'male' ? audioUrlMale : audioUrlFemale })
  } catch (err) {
    console.error('[TTS] Error:', err)
    res.status(500).json({ error: 'TTS generation failed', code: 'TTS_ERROR' })
  }
})

export default router
