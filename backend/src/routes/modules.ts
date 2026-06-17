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

    // Build a map of orderIndex → isCompleted for locking logic
    const completionByOrder = new Map<number, boolean>()
    modules.forEach((mod) => {
      completionByOrder.set(mod.orderIndex, progressMap.get(mod.id)?.isCompleted ?? false)
    })

    const result = modules.map((mod) => {
      const completedLessons = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length
      const progress = progressMap.get(mod.id)
      const isLocked = mod.orderIndex > 1 && !(completionByOrder.get(mod.orderIndex - 1) ?? false)

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
        isLocked,
      }
    })

    res.json({ modules: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

const MODULE_EMOJIS = ['👤','🍽️','🐾','👫','🎨','🏠','🏃','✈️','🏨','🍕','🤝']

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

    // Check if previous module is completed — if not, this module is locked
    if (mod.orderIndex > 1) {
      const prevModule = await prisma.module.findFirst({
        where: { orderIndex: mod.orderIndex - 1, isPublished: true },
        select: { id: true },
      })
      if (prevModule) {
        const prevProgress = await prisma.moduleProgress.findUnique({
          where: { userId_moduleId: { userId, moduleId: prevModule.id } },
          select: { isCompleted: true },
        })
        if (!prevProgress?.isCompleted) {
          res.status(403).json({ error: 'Complete the previous module first', code: 'MODULE_LOCKED' })
          return
        }
      }
    }

    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: mod.lessons.map((l) => l.id) } },
    })

    const progressMap = new Map(lessonProgress.map((p) => [p.lessonId, p]))
    const completedLessons = mod.lessons.filter((l) => progressMap.get(l.id)?.isCompleted).length
    const lessonCount = mod.lessons.length
    const emojiIndex = (mod.orderIndex - 1) % MODULE_EMOJIS.length

    res.json({
      module: {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        imageUrl: mod.imageUrl,
        orderIndex: mod.orderIndex,
        emoji: MODULE_EMOJIS[emojiIndex] ?? '📚',
        lessonCount,
        completedLessons,
        completionPercent: lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0,
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
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
