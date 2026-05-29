import { Router, Request, Response } from 'express'
import { verifyJWT } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { awardXP } from '../services/xpService'

const router = Router()
router.use(verifyJWT)

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

async function getTodaysChallenge() {
  const active = await prisma.dailyChallenge.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
    select: { id: true, question: true, sampleAnswer: true, keywords: true, xpReward: true, orderIndex: true },
  })
  if (active.length === 0) return null

  const today = getTodayDateString()
  const daysSinceEpoch = Math.floor(new Date(today).getTime() / 86400000)
  const index = daysSinceEpoch % active.length

  return active[index]
}

function checkAnswer(spokenText: string, keywords: string[]): boolean {
  const normalized = spokenText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()))
}

// GET /api/challenges/daily — returns today's question and whether user already attempted
router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const today = getTodayDateString()

  try {
    const challenge = await getTodaysChallenge()
    if (!challenge) {
      res.status(404).json({ error: 'No challenge available today', code: 'NO_CHALLENGE' })
      return
    }

    const existing = await prisma.dailyChallengeAttempt.findUnique({
      where: { userId_challengeDate: { userId, challengeDate: today } },
    })

    // Never send keywords or sampleAnswer before attempt — only after
    res.json({
      id: challenge.id,
      question: challenge.question,
      xpReward: challenge.xpReward,
      alreadyAttempted: !!existing,
      attemptResult: existing
        ? {
            correct: existing.correct,
            spokenText: existing.spokenText,
            xpEarned: existing.xpEarned,
            sampleAnswer: challenge.sampleAnswer,
          }
        : null,
    })
  } catch (err) {
    console.error('[GET /challenges/daily]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/challenges/daily/submit — submit a voice answer
router.post('/daily/submit', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const today = getTodayDateString()
  const { spokenText } = req.body

  if (!spokenText || typeof spokenText !== 'string' || spokenText.trim().length === 0) {
    res.status(400).json({ error: 'spokenText is required', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    // One attempt per day
    const existing = await prisma.dailyChallengeAttempt.findUnique({
      where: { userId_challengeDate: { userId, challengeDate: today } },
    })
    if (existing) {
      res.status(409).json({ error: 'Already attempted today', code: 'ALREADY_ATTEMPTED' })
      return
    }

    const challenge = await getTodaysChallenge()
    if (!challenge) {
      res.status(404).json({ error: 'No challenge available today', code: 'NO_CHALLENGE' })
      return
    }

    const correct = checkAnswer(spokenText.trim(), challenge.keywords)
    const xpEarned = correct ? challenge.xpReward : 0

    await prisma.dailyChallengeAttempt.create({
      data: {
        userId,
        challengeId: challenge.id,
        challengeDate: today,
        correct,
        spokenText: spokenText.trim(),
        xpEarned,
      },
    })

    let newXpTotal: number | undefined
    if (correct) {
      newXpTotal = await awardXP(userId, xpEarned)
    }

    res.json({
      correct,
      spokenText: spokenText.trim(),
      sampleAnswer: challenge.sampleAnswer,
      xpEarned,
      newXpTotal,
    })
  } catch (err) {
    console.error('[POST /challenges/daily/submit]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
