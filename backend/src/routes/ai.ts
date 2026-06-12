import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import {
  streamCoachResponse,
  checkGrammar,
  warmupChat,
  scorePronunciation,
  getHint,
  checkRateLimit,
  dailyGreetingChat,
  coachChat,
  getCoachStatus,
  startCoachSession,
} from '../services/aiService'
import { awardXP } from '../services/xpService'

const router = Router()

router.use(verifyJWT)

// POST /api/ai/daily-greeting
router.post('/daily-greeting', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array', code: 'VALIDATION_ERROR' })
    return
  }
  const userId = req.user!.userId
  const limited = await checkRateLimit(`rl:greeting:${userId}`, 20)
  if (!limited.allowed) {
    res.status(429).json({ error: 'Daily greeting limit reached.', code: 'RATE_LIMITED' })
    return
  }
  try {
    const result = await dailyGreetingChat(userId, messages)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/greeting-done  — marks greeting completed for today
router.post('/greeting-done', async (req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { lastGreetingDate: today },
    })
    res.json({ lastGreetingDate: today })
  } catch {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/ai/coach/status
router.get('/coach/status', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  try {
    const status = await getCoachStatus(userId)
    res.json(status)
  } catch {
    res.status(500).json({ error: 'Could not fetch status', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/coach/new-session
router.post('/coach/new-session', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  try {
    const result = await startCoachSession(userId)
    if (!result.allowed) {
      res.status(429).json({ error: 'Daily session limit reached.', code: 'SESSION_LIMIT', sessionsUsed: result.sessionsUsed })
      return
    }
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Could not start session', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/coach/message — non-streaming coach response with inline feedback
router.post('/coach/message', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId

  try {
    const status = await getCoachStatus(userId)
    if (!status.canChat) {
      res.status(429).json({
        error: status.messagesRemaining <= 0
          ? 'Daily message limit reached. Come back tomorrow!'
          : 'Daily session limit reached. Come back tomorrow!',
        code: status.messagesRemaining <= 0 ? 'OUT_OF_MESSAGES' : 'SESSION_LIMIT',
      })
      return
    }
  } catch (err) {
    // Fail-safe fallback if Redis query fails
  }

  const { allowed, remaining } = await checkRateLimit(`rl:coach-msg:${userId}`, 30)
  if (!allowed) {
    res.status(429).json({ error: 'Daily message limit reached. Come back tomorrow!', code: 'OUT_OF_MESSAGES' })
    return
  }

  awardXP(userId, 5).catch(console.error)

  try {
    const result = await coachChat(userId, messages)
    res.json({ ...result, messagesRemaining: remaining })
  } catch {
    res.status(500).json({ error: 'AI service error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/ai/coach  — streaming SSE (kept for future web use)
router.post('/coach', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array', code: 'VALIDATION_ERROR' })
    return
  }

  const userId = req.user!.userId
  const { allowed } = await checkRateLimit(`rl:coach-msg:${userId}`, 30)
  if (!allowed) {
    res.status(429).json({ error: 'Daily message limit reached.', code: 'RATE_LIMITED' })
    return
  }

  awardXP(userId, 5).catch(console.error)

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
  const { allowed } = await checkRateLimit(`rl:coach:${userId}`, 30)
  if (!allowed) {
    res.status(429).json({ error: 'Daily grammar check limit reached. Please try again tomorrow.', code: 'RATE_LIMITED' })
    return
  }

  try {
    const result = await checkGrammar(userId, text)
    res.json(result)
  } catch (err: any) {
    console.error('[grammar-check route] error:', err?.message ?? err)
    const errMsg = err?.message || ''
    if (err?.status === 429 || errMsg.includes('quota') || errMsg.includes('rate-limit') || errMsg.includes('429')) {
      res.status(429).json({ error: 'Gemini API daily quota exceeded. Please try again later.', code: 'API_QUOTA_EXCEEDED' })
    } else {
      res.status(500).json({ error: 'Failed to verify grammar. Please try again.', code: 'AI_ERROR' })
    }
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
  const { allowed } = await checkRateLimit(`rl:pronunciation:${userId}`, 50)
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
