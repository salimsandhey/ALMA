import { Router, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { uploadAvatar } from '../lib/cloudinary'
import { verifyJWT } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  age: z.number().int().min(10).max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  nativeLanguage: z.string().optional(),
  country: z.string().max(100).optional(),
})

// GET /api/users/me
router.get('/me', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, displayName: true, avatarUrl: true,
        age: true, gender: true, nativeLanguage: true, country: true, role: true,
        xpTotal: true, streakCount: true, isOnboardingComplete: true, createdAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' })
      return
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// PATCH /api/users/me
router.patch('/me', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: parsed.data,
    })

    res.json({ message: 'Profile updated.', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /api/users/me/avatar
router.post('/me/avatar', verifyJWT, upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const avatarUrl = await uploadAvatar(req.file.buffer, req.user!.userId)
    await prisma.user.update({ where: { id: req.user!.userId }, data: { avatarUrl } })
    res.json({ avatarUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed', code: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/users/me
router.delete('/me', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } })
    res.json({ message: 'Account deleted.' })
  } catch (err) {
    console.error('[DELETE /users/me]', err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
