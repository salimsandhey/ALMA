import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { verifyJWT } from '../middleware/auth'

const router = Router()

router.use(verifyJWT)

// GET /api/modules
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const modules = await prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: { lessons: { select: { id: true } } },
    })

    const progressRecords = await prisma.moduleProgress.findMany({
      where: { userId },
    })

    const lessonProgressRecords = await prisma.lessonProgress.findMany({
      where: { userId, isCompleted: true },
      select: { lessonId: true },
    })

    const completedLessonIds = new Set(lessonProgressRecords.map((p) => p.lessonId))
    const progressMap = new Map(progressRecords.map((p) => [p.moduleId, p]))

    const result = modules.map((mod) => {
      const completedLessons = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length
      const progress = progressMap.get(mod.id)

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        imageUrl: mod.imageUrl,
        orderIndex: mod.orderIndex,
        isPublished: mod.isPublished,
        lessonCount: mod.lessons.length,
        completedLessons,
        completionPercent: mod.lessons.length > 0
          ? Math.round((completedLessons / mod.lessons.length) * 100)
          : 0,
        isCompleted: progress?.isCompleted ?? false,
      }
    })

    res.json({ modules: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/modules/:moduleId
router.get('/:moduleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { moduleId } = req.params

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: { orderBy: { orderIndex: 'asc' } } },
    })

    if (!mod || !mod.isPublished) {
      res.status(404).json({ error: 'Module not found', code: 'NOT_FOUND' })
      return
    }

    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: mod.lessons.map((l) => l.id) } },
    })

    const progressMap = new Map(lessonProgress.map((p) => [p.lessonId, p]))

    res.json({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      imageUrl: mod.imageUrl,
      orderIndex: mod.orderIndex,
      lessons: mod.lessons.map((l) => {
        const p = progressMap.get(l.id)
        return {
          id: l.id,
          title: l.title,
          orderIndex: l.orderIndex,
          gameType: l.gameType,
          xpReward: l.xpReward,
          isCompleted: p?.isCompleted ?? false,
          xpEarned: p?.xpEarned ?? 0,
        }
      }),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/modules/lessons/:lessonId
router.get('/lessons/:lessonId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { lessonId } = req.params

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' })
      return
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })

    res.json({
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      gameType: lesson.gameType,
      xpReward: lesson.xpReward,
      content: lesson.content,
      isCompleted: progress?.isCompleted ?? false,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
