import { Router, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'
import { uploadLessonImage } from '../../lib/cloudinary'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

router.use(verifyJWT, requireAdmin)

// POST /api/admin/modules/upload-image
router.post('/upload-image', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided', code: 'NO_FILE' })
    return
  }
  try {
    const publicId = `lesson_${Date.now()}`
    const url = await uploadLessonImage(req.file.buffer, publicId)
    res.json({ url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed', code: 'UPLOAD_FAILED' })
  }
})

const moduleCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  imageUrl: z.string().optional(),
})

const moduleUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
})

const lessonCreateSchema = z.object({
  title: z.string().min(1),
  gameType: z.enum(['FLASHCARD', 'WORD_MATCH', 'FILL_BLANK', 'TRUE_FALSE', 'DIALOGUE', 'IMAGE_SPEAK']),
  content: z.any(),
  xpReward: z.number().int().min(1).optional(),
})

const lessonUpdateSchema = lessonCreateSchema.partial()

// GET /api/admin/modules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } })

    const modules = await prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: { select: { id: true }, orderBy: { orderIndex: 'asc' } },
      },
    })

    const completionCounts = await prisma.moduleProgress.groupBy({
      by: ['moduleId'],
      where: { isCompleted: true },
      _count: { moduleId: true },
    })
    const countMap = new Map(completionCounts.map((c) => [c.moduleId, c._count.moduleId]))

    // Compute avg completion % per module
    const result = await Promise.all(
      modules.map(async (m) => {
        let avgCompletion = 0
        if (totalStudents > 0 && m.lessons.length > 0) {
          const completed = await prisma.lessonProgress.count({
            where: { lessonId: { in: m.lessons.map((l) => l.id) }, isCompleted: true },
          })
          avgCompletion = Math.round((completed / (totalStudents * m.lessons.length)) * 100)
        }
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          imageUrl: m.imageUrl,
          orderIndex: m.orderIndex,
          isPublished: m.isPublished,
          lessonCount: m.lessons.length,
          totalCompletions: countMap.get(m.id) ?? 0,
          avgCompletion,
        }
      }),
    )

    res.json({ modules: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/modules
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = moduleCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  try {
    const maxOrder = await prisma.module.aggregate({ _max: { orderIndex: true } })
    const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1

    const module = await prisma.module.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        orderIndex: nextOrder,
        isPublished: false,
      },
    })

    res.status(201).json({ message: 'Module created.', module })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/modules/:moduleId
router.patch('/:moduleId', async (req: Request, res: Response): Promise<void> => {
  const parsed = moduleUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const module = await prisma.module.update({
      where: { id: req.params.moduleId },
      data: parsed.data,
    })
    res.json({ message: 'Module updated.', module })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/modules/:moduleId
router.delete('/:moduleId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.module.delete({ where: { id: req.params.moduleId } })
    res.json({ message: 'Module deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/modules/:moduleId/lessons
router.get('/:moduleId/lessons', async (req: Request, res: Response): Promise<void> => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId: req.params.moduleId },
      orderBy: { orderIndex: 'asc' },
    })
    res.json({ lessons })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/modules/:moduleId/lessons
router.post('/:moduleId/lessons', async (req: Request, res: Response): Promise<void> => {
  const parsed = lessonCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  try {
    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId: req.params.moduleId },
      _max: { orderIndex: true },
    })
    const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1

    const lesson = await prisma.lesson.create({
      data: {
        moduleId: req.params.moduleId,
        title: parsed.data.title,
        gameType: parsed.data.gameType,
        content: parsed.data.content ?? {},
        xpReward: parsed.data.xpReward ?? 20,
        orderIndex: nextOrder,
      },
    })

    res.status(201).json({ message: 'Lesson added.', lesson })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/admin/lessons/:lessonId
router.patch('/lessons/:lessonId', async (req: Request, res: Response): Promise<void> => {
  const parsed = lessonUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const lesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: parsed.data,
    })
    res.json({ message: 'Lesson updated.', lesson })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/lessons/:lessonId
router.delete('/lessons/:lessonId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.lessonId } })
    res.json({ message: 'Lesson deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
