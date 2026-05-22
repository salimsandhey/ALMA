import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth'
import {
  streamCoachResponse,
  checkGrammar,
  warmupChat,
  scorePronunciation,
  getHint,
  checkRateLimit,
} from '../services/aiService'

const router = Router()

router.use(verifyJWT)

// POST /api/ai/coach  — streaming SSE
router.post('/coach', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:coach:${userId}`, 20)
  if (!allowed) {
    res.status(429).json({ error: 'Daily message limit reached.', code: 'RATE_LIMITED' })
    return
  }

  try {
    await streamCoachResponse(userId, messages, res)
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
    }
  }
})

// POST /api/ai/grammar-check
router.post('/grammar-check', async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:coach:${userId}`, 20)
  if (!allowed) {
    res.json({ hasError: false }) // fail silently
    return
  }

  try {
    const result = await checkGrammar(text)
    res.json(result)
  } catch (err) {
    res.json({ hasError: false, correctedText: text, explanation: '', errorType: null })
  }
})

// POST /api/ai/warmup
router.post('/warmup', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:warmup:${userId}`, 3)
  if (!allowed) {
    res.status(429).json({ error: 'Daily warm-up limit reached.', code: 'RATE_LIMITED' })
    return
  }

  try {
    const result = await warmupChat(userId, messages)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/pronunciation
router.post('/pronunciation', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ targetText: z.string(), spokenText: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:pronunciation:${userId}`, 100)
  if (!allowed) {
    res.status(429).json({ error: 'Daily pronunciation limit reached.', code: 'RATE_LIMITED' })
    return
  }

  try {
    const result = await scorePronunciation(userId, parsed.data.targetText, parsed.data.spokenText)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/hint
router.post('/hint', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    gameType: z.string(),
    cardContent: z.record(z.any()),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:hint:${userId}`, 5)
  if (!allowed) {
    res.status(429).json({ error: 'Daily hint limit reached.', code: 'RATE_LIMITED' })
    return
  }

  try {
    const hint = await getHint(userId, parsed.data.gameType, parsed.data.cardContent)
    res.json({ hint })
  } catch (err) {
    res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
  }
})

export default router
