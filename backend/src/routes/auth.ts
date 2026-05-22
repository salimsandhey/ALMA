import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import crypto from 'crypto'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from '../lib/prisma'
import { signToken, signResetToken, verifyResetToken } from '../lib/jwt'
import { sendOTPEmail } from '../lib/email'
import { verifyJWT } from '../middleware/auth'

const router = Router()
const appDeepLinkCallback = process.env.APP_DEEP_LINK_CALLBACK || 'alma://auth/google-callback'
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'

// ─── Passport Google strategy (only registered when credentials are set) ──────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          if (!email) return done(new Error('No email from Google'))

          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                displayName: profile.displayName || email.split('@')[0],
                isEmailVerified: true,
                role: 'STUDENT',
              },
            })
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, isEmailVerified: true },
            })
          }

          return done(null, { userId: user.id, role: user.role, email: user.email })
        } catch (err) {
          return done(err as Error)
        }
      }
    )
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999))
}

async function createOTP(userId: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<string> {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Invalidate previous unused OTPs for same purpose
  await prisma.oTPCode.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  })

  await prisma.oTPCode.create({ data: { userId, code, purpose, expiresAt } })
  return code
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email(),
  password: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
})

const verifyOTPSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
})

const resendOTPSchema = z.object({
  userId: z.string(),
  purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const verifyResetOTPSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
})

const resetPasswordSchema = z.object({
  resetToken: z.string(),
  newPassword: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
})

const onboardingSchema = z.object({
  displayName: z.string().min(2).max(50),
  age: z.number().int().min(10).max(100),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  nativeLanguage: z.string().min(1),
  country: z.string().length(2).optional(),
})

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { displayName, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already registered', code: 'CONFLICT' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { displayName: displayName || email.split('@')[0], email, passwordHash, role: 'STUDENT' },
    })

    const code = await createOTP(user.id, 'EMAIL_VERIFICATION')
    await sendOTPEmail(email, code, 'EMAIL_VERIFICATION')

    res.status(201).json({ message: 'OTP sent to your email. Please verify.', userId: user.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const parsed = verifyOTPSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { userId, code, purpose } = parsed.data

  try {
    const otp = await prisma.oTPCode.findFirst({
      where: { userId, code, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      res.status(400).json({ error: 'Invalid OTP', code: 'INVALID_OTP' })
      return
    }

    if (otp.expiresAt < new Date()) {
      res.status(400).json({ error: 'OTP has expired', code: 'OTP_EXPIRED' })
      return
    }

    await prisma.oTPCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } })

    if (purpose === 'EMAIL_VERIFICATION') {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      })

      const token = signToken({ userId: user.id, role: user.role, email: user.email })

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isOnboardingComplete: user.isOnboardingComplete,
        },
      })
    } else {
      // PASSWORD_RESET — return a short-lived reset token, not a full JWT
      const resetToken = signResetToken(userId)
      res.json({ resetToken })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────

router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  const parsed = resendOTPSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { userId, purpose } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' })
      return
    }

    // Enforce 60-second cooldown
    const recent = await prisma.oTPCode.findFirst({
      where: { userId, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (recent && recent.createdAt > new Date(Date.now() - 60 * 1000)) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP', code: 'RATE_LIMITED' })
      return
    }

    const code = await createOTP(userId, purpose)
    await sendOTPEmail(user.email, code, purpose)

    res.json({ message: 'OTP resent successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { email, password } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    if (!user.isEmailVerified) {
      res.status(401).json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED', userId: user.id })
      return
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated', code: 'ACCOUNT_INACTIVE' })
      return
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { email } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return 200 — don't reveal whether email exists
    if (user && user.isEmailVerified) {
      const code = await createOTP(user.id, 'PASSWORD_RESET')
      await sendOTPEmail(email, code, 'PASSWORD_RESET')
    }

    res.json({ message: 'If that email exists, a reset code has been sent.', userId: user?.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/verify-reset-otp ─────────────────────────────────────────
// Alias: same as /verify-otp with purpose PASSWORD_RESET — kept separate for clarity

router.post('/verify-reset-otp', async (req: Request, res: Response): Promise<void> => {
  const parsed = verifyResetOTPSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { userId, code } = parsed.data

  try {
    const otp = await prisma.oTPCode.findFirst({
      where: { userId, code, purpose: 'PASSWORD_RESET', usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      res.status(400).json({ error: 'Invalid OTP', code: 'INVALID_OTP' })
      return
    }

    if (otp.expiresAt < new Date()) {
      res.status(400).json({ error: 'OTP has expired', code: 'OTP_EXPIRED' })
      return
    }

    await prisma.oTPCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } })

    const resetToken = signResetToken(userId)
    res.json({ resetToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { resetToken, newPassword } = parsed.data

  try {
    const { userId } = verifyResetToken(resetToken)
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    res.json({ message: 'Password updated successfully.' })
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' })
  }
})

// ─── GET /api/auth/google ─────────────────────────────────────────────────────

router.get('/google', (req: Request, res: Response, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: 'Google OAuth is not configured', code: 'NOT_CONFIGURED' })
    return
  }
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })(req, res, next)
})

// ─── GET /api/auth/google/callback ───────────────────────────────────────────

router.get('/google/callback', (req: Request, res: Response, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: 'Google OAuth is not configured', code: 'NOT_CONFIGURED' })
    return
  }
  passport.authenticate('google', { session: false, failureRedirect: '/login' }, (_err: any, user: any) => {
    if (!user) { res.redirect(`${appDeepLinkCallback}?error=auth_failed`); return }
    const token = signToken({ userId: user.userId, role: user.role, email: user.email })
    res.redirect(`${appDeepLinkCallback}?token=${token}`)
  })(req, res, next)
})

// ─── PATCH /api/users/onboarding (protected) ─────────────────────────────────

router.patch('/onboarding', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  const parsed = onboardingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { displayName, age, gender, nativeLanguage, country } = parsed.data

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { displayName, age, gender, nativeLanguage, country, isOnboardingComplete: true },
    })

    res.json({ message: 'Onboarding complete.', user: { ...user, isOnboardingComplete: true } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
