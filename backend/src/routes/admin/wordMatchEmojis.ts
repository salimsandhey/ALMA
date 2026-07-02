import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { verifyJWT } from '../../middleware/auth'
import { requireAdmin } from '../../middleware/adminAuth'
import { WORD_MATCH_EMOJIS } from '../../data/wordMatchEmojis'

const router = Router()
router.use(verifyJWT, requireAdmin)

// GET /api/admin/word-match-emojis — preview what will be applied
router.get('/', async (_req: Request, res: Response) => {
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: Object.keys(WORD_MATCH_EMOJIS) } },
    select: { id: true, title: true, content: true, module: { select: { title: true } } },
  })
  const preview = lessons.map((l) => ({
    id: l.id,
    module: (l as any).module.title,
    lesson: l.title,
    cards: ((l.content as any)?.cards ?? []).map((c: any) => ({
      word: c.correctWord,
      currentEmoji: c.emoji ?? null,
      newEmoji: WORD_MATCH_EMOJIS[l.id]?.[c.correctWord] ?? '❓',
    })),
  }))
  res.json({ preview })
})

// POST /api/admin/word-match-emojis — apply emojis in one transaction
// Body: { overrides?: Record<lessonId, Record<word, emoji>> }
// Falls back to WORD_MATCH_EMOJIS defaults for any missing entry
router.post('/', async (req: Request, res: Response) => {
  const overrides: Record<string, Record<string, string>> = req.body?.overrides ?? {}

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: Object.keys(WORD_MATCH_EMOJIS) } },
    select: { id: true, content: true },
  })

  await prisma.$transaction(
    lessons.map((l) => {
      const emojiMap = { ...(WORD_MATCH_EMOJIS[l.id] ?? {}), ...(overrides[l.id] ?? {}) }
      const cards = ((l.content as any)?.cards ?? []).map((c: any) => ({
        ...c,
        emoji: emojiMap[c.correctWord] ?? c.emoji ?? '❓',
      }))
      return prisma.lesson.update({
        where: { id: l.id },
        data: { content: { ...(l.content as any), cards } },
      })
    })
  )

  res.json({ ok: true, updated: lessons.length })
})

export default router
