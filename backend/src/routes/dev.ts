import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// Only active in development
router.use((_req: Request, res: Response, next: any) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' })
    return
  }
  next()
})

// Emoji map: lessonId → { cardWord → emoji }
const WORD_MATCH_EMOJIS: Record<string, Record<string, string>> = {
  // Personal Information – Personal Details Match
  cmpxuqtao000g2679u2sajc4h: {
    Birthday: '🎂', Eyes: '👀', Hair: '💇', Height: '📏', Passion: '❤️‍🔥', Gender: '🧑',
  },
  // Food & Drink – Meal Time Match
  cmpxuqtaw000r2679sx40hcrn: {
    Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍿', Dessert: '🍰', Drink: '🥤',
  },
  // Pets & Animals – Animal Match
  cmpxuqtb100122679pmuhso3w: {
    Dog: '🐕', Cat: '🐱', Lemur: '🦎', Dolphin: '🐬', Whale: '🐋', Parrot: '🦜',
  },
  // Friends & Social Life – Social Words Match
  cmpxuqtb9001d2679i5rt8bbu: {
    Friend: '👫', Surprise: '🎉', Argument: '🗣️', Music: '🎵', School: '🏫', Together: '🤝',
  },
  // Hobbies & Interests – Hobby Match
  cmpxuqtbf001o2679x9unc9cd: {
    Dancing: '💃', Reading: '📚', Cooking: '👨‍🍳', Swimming: '🏊', Drawing: '🎨', Sports: '⚽',
  },
  // Home & Country – Places Match
  cmpxuqtbo001z2679iku5bb62: {
    Beach: '🏖️', Mountains: '⛰️', Market: '🏪', Museum: '🏛️', Temple: '⛩️', Stadium: '🏟️',
  },
  // Leisure & Activities – Activities Match
  cmpxuqtbt002a2679ennxsncc: {
    Hiking: '🥾', Swimming: '🏊', Reading: '📚', Cycling: '🚴', Camping: '⛺', Picnic: '🧺',
  },
  // Travel & Vacation – Transport Match
  cmpxuqtby002l26795d832uaw: {
    Plane: '✈️', Train: '🚂', Boat: '⛵', Car: '🚗', Bus: '🚌', Bicycle: '🚲',
  },
  // Hotel & Hospitality – Hotel Vocabulary Match
  cmpxuqtc5002w267949u4b8a3: {
    Lobby: '🏨', Elevator: '🛗', Luggage: '🧳', 'Room Key': '🗝️', Pool: '🏊', Reception: '💁',
  },
  // Restaurant & Food Service – Restaurant Match
  cmpxuqtca00372679wpyvb8n0: {
    Menu: '📋', Waiter: '🤵', Appetizer: '🥗', 'Main Course': '🍖', Dessert: '🍰', Bill: '🧾',
  },
  // Handling Complaints – Complaint Phrase Match
  cmpxuqtch003i2679bwgrbmah: {
    Apologize: '🙏', Complaint: '😤', Fix: '🔧', Manager: '👔', Refund: '💰', Solution: '✅',
  },
  // News & Sports – Sports Match
  cmpxuqtcm003t267921rd8lpa: {
    Football: '⚽', Basketball: '🏀', Tennis: '🎾', Swimming: '🏊', Cycling: '🚴', Boxing: '🥊',
  },
  // Tourism – Famous Landmarks Match
  cmpxuqtcs004426790u12anw1: {
    'Eiffel Tower': '🗼', Pyramid: '🔺', 'Cruise Ship': '🚢', 'National Park': '🌲', 'Amusement Park': '🎡', Zoo: '🦁',
  },
  // Languages – Language Match
  cmpxuqtd0004f2679fqfj3vl2: {
    English: '🇬🇧', French: '🇫🇷', Arabic: '🇸🇦', Swahili: '🌍', Malagasy: '🇲🇬', Hindi: '🇮🇳',
  },
}

// GET /api/dev/word-match-emojis — preview what will be applied
router.get('/word-match-emojis', async (_req: Request, res: Response) => {
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

// POST /api/dev/word-match-emojis — apply emojis in one transaction
// Body: { overrides?: Record<lessonId, Record<word, emoji>> }
// Falls back to WORD_MATCH_EMOJIS defaults for any missing entry
router.post('/word-match-emojis', async (req: Request, res: Response) => {
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
