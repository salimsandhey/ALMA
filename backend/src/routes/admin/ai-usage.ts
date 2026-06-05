import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'

const router = Router()
router.use(verifyJWT, requireAdmin)

// Gemini 2.5 Flash pricing (USD per 1M tokens)
const PRICE_INPUT_PER_M  = 0.075
const PRICE_OUTPUT_PER_M = 0.30

function calcCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PRICE_INPUT_PER_M
       + (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
}

const FEATURE_LABELS: Record<string, string> = {
  coach:          'AI Coach',
  daily_greeting: 'Daily Greeting',
  warmup:         'Warm-up Chat',
  pronunciation:  'Pronunciation Score',
  hint:           'Lesson Hints',
  grammar:        'Grammar Check',
}

// GET /api/admin/ai-usage?period=7d|30d|all
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const period = String(req.query.period ?? '30d')
    let since: Date | undefined
    if (period === '7d')  since = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
    if (period === '30d') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const where = since ? { createdAt: { gte: since } } : {}

    // 1. Totals
    const totals = await prisma.aIUsageLog.aggregate({
      where,
      _count: { id: true },
      _sum:   { inputTokens: true, outputTokens: true },
    })
    const totalCalls        = totals._count.id
    const totalInputTokens  = totals._sum.inputTokens  ?? 0
    const totalOutputTokens = totals._sum.outputTokens ?? 0
    const estimatedCost     = calcCost(totalInputTokens, totalOutputTokens)

    // 2. By feature
    const byFeatureRaw = await prisma.aIUsageLog.groupBy({
      by: ['feature'],
      where,
      _count: { id: true },
      _sum:   { inputTokens: true, outputTokens: true },
      orderBy: { _sum: { inputTokens: 'desc' } },
    })
    const byFeature = byFeatureRaw.map((f) => {
      const inp = f._sum.inputTokens  ?? 0
      const out = f._sum.outputTokens ?? 0
      return {
        feature:       f.feature,
        label:         FEATURE_LABELS[f.feature] ?? f.feature,
        calls:         f._count.id,
        inputTokens:   inp,
        outputTokens:  out,
        totalTokens:   inp + out,
        estimatedCost: calcCost(inp, out),
      }
    })

    // 3. Top users by token consumption
    const topUsersRaw = await prisma.aIUsageLog.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      _sum:   { inputTokens: true, outputTokens: true },
      orderBy: { _sum: { inputTokens: 'desc' } },
      take: 10,
    })
    const userIds = topUsersRaw.map((u) => u.userId)
    const users   = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u.displayName]))
    const topUsers = topUsersRaw.map((u) => {
      const inp = u._sum.inputTokens  ?? 0
      const out = u._sum.outputTokens ?? 0
      return {
        userId:        u.userId,
        displayName:   userMap.get(u.userId) ?? 'Unknown',
        calls:         u._count.id,
        inputTokens:   inp,
        outputTokens:  out,
        totalTokens:   inp + out,
        estimatedCost: calcCost(inp, out),
      }
    })

    // 4. Daily trend — last N days
    const trendDays = period === '7d' ? 7 : 30
    const trendSince = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000)
    const logs = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: trendSince } },
      select: { createdAt: true, inputTokens: true, outputTokens: true },
    })

    // Group by date string
    const dayMap = new Map<string, { inputTokens: number; outputTokens: number; calls: number }>()
    for (let i = 0; i < trendDays; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      dayMap.set(key, { inputTokens: 0, outputTokens: 0, calls: 0 })
    }
    for (const log of logs) {
      const key = log.createdAt.toISOString().split('T')[0]
      const entry = dayMap.get(key)
      if (entry) {
        entry.inputTokens  += log.inputTokens
        entry.outputTokens += log.outputTokens
        entry.calls++
      }
    }
    const dailyTrend = [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v, totalTokens: v.inputTokens + v.outputTokens }))

    res.json({
      period,
      overview: { totalCalls, totalInputTokens, totalOutputTokens, totalTokens: totalInputTokens + totalOutputTokens, estimatedCost },
      byFeature,
      topUsers,
      dailyTrend,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
