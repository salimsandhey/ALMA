import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth'
import { getTTSAudio } from '../services/ttsService'

const router = Router()
router.use(verifyJWT)

const schema = z.object({
  text: z.string().min(1).max(500),
  voice: z.enum(['female', 'male']).default('female'),
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }
  try {
    const url = await getTTSAudio(parsed.data.text, parsed.data.voice)
    res.json({ url })
  } catch (err) {
    console.error('[tts] error:', err)
    res.status(500).json({ error: 'TTS unavailable', code: 'TTS_ERROR' })
  }
})

export default router
