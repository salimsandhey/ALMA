import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import passport from 'passport'

dotenv.config()

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
import musicRouter from './routes/music'
import challengesRouter from './routes/challenges'
import entertainmentRouter from './routes/entertainment'

const app = express()

app.use(cors({ origin: '*' }))
app.use(helmet())
app.use(express.json({ limit: '10mb' }))
app.use(passport.initialize())

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
app.use('/api/music', musicRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/entertainment', entertainmentRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message, code: 'INTERNAL_ERROR' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
