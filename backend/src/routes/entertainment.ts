import { Router, Request, Response } from 'express'
import { verifyJWT } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { awardXP } from '../services/xpService'
import { gradeQuizAnswersWithAI } from '../services/aiService'
import { evaluateAndAward } from '../services/badgeService'

const router = Router()
router.use(verifyJWT)

// GET /api/entertainment — list all published content with user completion status
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId

  try {
    const [content, attempts] = await Promise.all([
      prisma.entertainmentContent.findMany({
        where: { isPublished: true },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          url: true,
          duration: true,
          xpReward: true,
          orderIndex: true,
          _count: { select: { questions: true } },
        },
      }),
      prisma.entertainmentAttempt.findMany({
        where: { userId },
        select: { contentId: true, score: true, xpEarned: true },
      }),
    ])

    const attemptMap = new Map(attempts.map((a) => [a.contentId, a]))

    const items = content.map((c) => {
      const attempt = attemptMap.get(c.id)
      return {
        ...c,
        questionCount: c._count.questions,
        completed: !!attempt,
        score: attempt?.score ?? null,
        xpEarned: attempt?.xpEarned ?? null,
      }
    })

    const completed = attempts.length
    const total = content.length

    res.json({ items, completed, total })
  } catch (err) {
    console.error('[GET /entertainment]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/entertainment/:id — get content with questions (no correct answers exposed)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { id } = req.params

  try {
    const content = await prisma.entertainmentContent.findFirst({
      where: { id, isPublished: true },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, question: true, orderIndex: true },
        },
      },
    })

    if (!content) {
      res.status(404).json({ error: 'Content not found', code: 'NOT_FOUND' })
      return
    }

    const attempt = await prisma.entertainmentAttempt.findUnique({
      where: { userId_contentId: { userId, contentId: id } },
    })

    res.json({
      id: content.id,
      type: content.type,
      title: content.title,
      description: content.description,
      url: content.url,
      duration: content.duration,
      xpReward: content.xpReward,
      questions: content.questions,
      completed: !!attempt,
      attempt: attempt
        ? { score: attempt.score, xpEarned: attempt.xpEarned, answers: attempt.answers }
        : null,
    })
  } catch (err) {
    console.error('[GET /entertainment/:id]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/entertainment/:id/attempt — submit quiz answers
router.post('/:id/attempt', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { id } = req.params
  const { answers } = req.body

  if (!Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: 'answers array is required', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const existing = await prisma.entertainmentAttempt.findUnique({
      where: { userId_contentId: { userId, contentId: id } },
    })
    if (existing) {
      res.status(409).json({ error: 'Already attempted', code: 'ALREADY_ATTEMPTED' })
      return
    }

    const content = await prisma.entertainmentContent.findFirst({
      where: { id, isPublished: true },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, question: true, expectedAnswer: true, keywords: true },
        },
      },
    })

    if (!content) {
      res.status(404).json({ error: 'Content not found', code: 'NOT_FOUND' })
      return
    }

    const answerInputs = content.questions.map((q) => {
      const submitted = answers.find((a: any) => a.questionId === q.id)
      return {
        questionId: q.id,
        question: q.question,
        spokenText: submitted?.spokenText?.trim() ?? '',
        expectedAnswer: q.expectedAnswer,
        keywords: q.keywords,
      }
    })

    const aiGrades = await gradeQuizAnswersWithAI(answerInputs)
    const gradeMap = new Map(aiGrades.map((g) => [g.questionId, g.correct]))

    const gradedAnswers = answerInputs.map((a) => ({
      questionId: a.questionId,
      question: a.question,
      spokenText: a.spokenText,
      correct: gradeMap.get(a.questionId) ?? false,
      expectedAnswer: a.expectedAnswer,
    }))

    const correctCount = gradedAnswers.filter((a) => a.correct).length
    const score = content.questions.length > 0
      ? Math.round((correctCount / content.questions.length) * 100)
      : 0
    const xpEarned = Math.round((score / 100) * content.xpReward)

    await prisma.entertainmentAttempt.create({
      data: {
        userId,
        contentId: id,
        score,
        xpEarned,
        answers: gradedAnswers,
      },
    })

    let newXpTotal: number | undefined
    if (xpEarned > 0) {
      newXpTotal = await awardXP(userId, xpEarned)
    }

    await evaluateAndAward(userId, 'first_entertainment')

    res.json({ score, xpEarned, newXpTotal, answers: gradedAnswers })
  } catch (err) {
    console.error('[POST /entertainment/:id/attempt]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
