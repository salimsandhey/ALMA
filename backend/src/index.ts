import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import passport from 'passport'

dotenv.config()

import { apiLimiter, aiLimiter } from './middleware/rateLimit'
import authRouter from './routes/auth'
import usersRouter from './routes/users'
import modulesRouter from './routes/modules'
import lessonsRouter from './routes/lessons'
import progressRouter from './routes/progress'
import aiRouter from './routes/ai'
import exploreRouter from './routes/explore'
import leaderboardRouter from './routes/leaderboard'
import badgesRouter from './routes/badges'
import feedbackRouter from './routes/feedback'
import adminOverviewRouter from './routes/admin/overview'
import adminStudentsRouter from './routes/admin/students'
import adminModulesRouter from './routes/admin/modules'
import adminContentRouter from './routes/admin/content'
import adminFeedbackRouter from './routes/admin/feedback'
import adminEntertainmentRouter from './routes/admin/entertainment'
import adminChallengesRouter from './routes/admin/challenges'
import adminSongsRouter from './routes/admin/songs'
import adminAiUsageRouter from './routes/admin/ai-usage'
import adminLegalRouter from './routes/admin/legal'
import legalRouter from './routes/legal'
import musicRouter from './routes/music'
import challengesRouter from './routes/challenges'
import entertainmentRouter from './routes/entertainment'
import referenceRouter from './routes/reference'
import ttsRouter from './routes/tts'
import devRouter from './routes/dev'

const app = express()

app.set('trust proxy', 1)
app.use(cors({ origin: '*' }))
app.use(helmet())
app.use(express.json({ limit: '10mb' }))
app.use(passport.initialize())
app.use(apiLimiter)
app.use('/api/ai', aiLimiter)

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/modules', modulesRouter)
app.use('/api/lessons', lessonsRouter)
app.use('/api/progress', progressRouter)
app.use('/api/ai', aiRouter)
app.use('/api/explore', exploreRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/badges', badgesRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/admin/overview', adminOverviewRouter)
app.use('/api/admin/students', adminStudentsRouter)
app.use('/api/admin/modules', adminModulesRouter)
app.use('/api/admin/content', adminContentRouter)
app.use('/api/admin/feedback', adminFeedbackRouter)
app.use('/api/admin/entertainment', adminEntertainmentRouter)
app.use('/api/admin/challenges', adminChallengesRouter)
app.use('/api/admin/songs', adminSongsRouter)
app.use('/api/admin/ai-usage', adminAiUsageRouter)
app.use('/api/admin/legal', adminLegalRouter)
app.use('/api/legal', legalRouter)
app.use('/api/music', musicRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/entertainment', entertainmentRouter)
app.use('/api', referenceRouter)
app.use('/api/tts', ttsRouter)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRouter)
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Delete unverified accounts older than 24 hours — runs every hour
import { prisma } from './lib/prisma'
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { count } = await prisma.user.deleteMany({
      where: { isEmailVerified: false, createdAt: { lt: cutoff } },
    })
    if (count > 0) console.log(`[cleanup] Deleted ${count} unverified account(s) older than 24h`)
  } catch (err) {
    console.error('[cleanup] Failed to delete unverified accounts:', err)
  }
}, 60 * 60 * 1000)

export default app
