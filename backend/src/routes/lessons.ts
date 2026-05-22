import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

const MODULE_EMOJIS = ['👤','🍽️','🐾','👫','🎨','🏠','🏃','✈️','🏨','🍕','🤝']

// GET /api/lessons/:lessonId
router.get('/:lessonId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { lessonId } = req.params

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { title: true, orderIndex: true } } },
    })
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' })
      return
    }

    // Find the next lesson in the same module
    const nextLesson = await prisma.lesson.findFirst({
      where: { moduleId: lesson.moduleId, orderIndex: { gt: lesson.orderIndex } },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    })

    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    const emojiIndex = (lesson.module.orderIndex - 1) % MODULE_EMOJIS.length

    res.json({
      lesson: {
        id: lesson.id,
        moduleId: lesson.moduleId,
        moduleTitle: lesson.module.title,
        moduleEmoji: MODULE_EMOJIS[emojiIndex] ?? '📚',
        title: lesson.title,
        gameType: lesson.gameType,
        xpReward: lesson.xpReward,
        content: lesson.content,
        isCompleted: progress?.isCompleted ?? false,
        nextLessonId: nextLesson?.id ?? null,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
