/**
 * Data migration runner — runs automatically on every deploy before the server starts.
 * Every migration must be IDEMPOTENT (safe to run multiple times).
 * Add new migrations at the bottom of the `migrations` array.
 */

import { PrismaClient } from '@prisma/client'
import { WORD_MATCH_EMOJIS } from '../data/wordMatchEmojis'
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../routes/legal'

const prisma = new PrismaClient()

// ─── Migration definitions ────────────────────────────────────────────────────

const migrations: { id: string; run: () => Promise<void> }[] = [

  // ── M001: Personal Information flashcard — switch Cloudinary → local keys ──
  {
    id: 'M001-pi-flashcard-local-images',
    run: async () => {
      const lesson = await prisma.lesson.findUnique({
        where: { id: 'cmpxuqtac000e2679m7o5q2k0' },
        select: { content: true },
      })
      if (!lesson) return
      const cards: any[] = (lesson.content as any)?.cards ?? []
      const needsFix = cards.some((c: any) => c.imageUrl?.startsWith('http'))
      if (!needsFix) return

      await prisma.lesson.update({
        where: { id: 'cmpxuqtac000e2679m7o5q2k0' },
        data: {
          content: {
            cards: [
              { id: 'c1', word: 'Name',          audioUrl: null, imageUrl: 'local:pi-keywords-name',          targetWord: 'name',          translation: 'Personal information keyword' },
              { id: 'c2', word: 'Age',           audioUrl: null, imageUrl: 'local:pi-keywords-age',           targetWord: 'age',           translation: 'Personal information keyword' },
              { id: 'c3', word: 'Hometown',      audioUrl: null, imageUrl: 'local:pi-keywords-hometown',      targetWord: 'hometown',      translation: 'Personal information keyword' },
              { id: 'c4', word: 'Mother tongue', audioUrl: null, imageUrl: 'local:pi-keywords-mother-tongue', targetWord: 'mother tongue', translation: 'Personal information keyword' },
              { id: 'c5', word: 'Dream job',     audioUrl: null, imageUrl: 'local:pi-keywords-dream-job',     targetWord: 'dream job',     translation: 'Personal information keyword' },
            ],
          },
        },
      })
      console.log('[migrate] M001 applied')
    },
  },

  // ── M002: Food & Drink flashcard — switch Cloudinary → local keys ──────────
  {
    id: 'M002-fd-flashcard-local-images',
    run: async () => {
      const lesson = await prisma.lesson.findUnique({
        where: { id: 'cmpxuqtav000p2679vlgdrcp8' },
        select: { content: true },
      })
      if (!lesson) return
      const cards: any[] = (lesson.content as any)?.cards ?? []
      const needsFix = cards.some((c: any) => c.imageUrl?.startsWith('http'))
      if (!needsFix) return

      await prisma.lesson.update({
        where: { id: 'cmpxuqtav000p2679vlgdrcp8' },
        data: {
          content: {
            cards: [
              { id: 'c1', word: 'Breakfast',  audioUrl: null, imageUrl: 'local:fd-words-breakfast',  targetWord: 'breakfast',  translation: 'Food and drink keyword' },
              { id: 'c2', word: 'Vegetables', audioUrl: null, imageUrl: 'local:fd-words-vegetables', targetWord: 'vegetables', translation: 'Food and drink keyword' },
              { id: 'c3', word: 'Spicy',      audioUrl: null, imageUrl: 'local:fd-words-spicy',      targetWord: 'spicy',      translation: 'Food and drink keyword' },
              { id: 'c4', word: 'Dessert',    audioUrl: null, imageUrl: 'local:fd-words-dessert',    targetWord: 'dessert',    translation: 'Food and drink keyword' },
              { id: 'c5', word: 'Recipe',     audioUrl: null, imageUrl: 'local:fd-words-recipe',     targetWord: 'recipe',     translation: 'Food and drink keyword' },
            ],
          },
        },
      })
      console.log('[migrate] M002 applied')
    },
  },

  // ── M003: Word match emojis — seed all 14 lessons (skips if already set) ───
  {
    id: 'M003-word-match-emojis',
    run: async () => {
      const EMOJIS: Record<string, Record<string, string>> = {
        cmpxuqtao000g2679u2sajc4h: { Birthday: '🎂', Eyes: '👀', Hair: '💇', Height: '📏', Passion: '❤️‍🔥', Gender: '🧑' },
        cmpxuqtaw000r2679sx40hcrn: { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍿', Dessert: '🍰', Drink: '🥤' },
        cmpxuqtb100122679pmuhso3w: { Dog: '🐕', Cat: '🐱', Lemur: '🦎', Dolphin: '🐬', Whale: '🐋', Parrot: '🦜' },
        cmpxuqtb9001d2679i5rt8bbu: { Friend: '👫', Surprise: '🎉', Argument: '🗣️', Music: '🎵', School: '🏫', Together: '🤝' },
        cmpxuqtbf001o2679x9unc9cd: { Dancing: '💃', Reading: '📚', Cooking: '👨‍🍳', Swimming: '🏊', Drawing: '🎨', Sports: '⚽' },
        cmpxuqtbo001z2679iku5bb62: { Beach: '🏖️', Mountains: '⛰️', Market: '🏪', Museum: '🏛️', Temple: '⛩️', Stadium: '🏟️' },
        cmpxuqtbt002a2679ennxsncc: { Hiking: '🥾', Swimming: '🏊', Reading: '📚', Cycling: '🚴', Camping: '⛺', Picnic: '🧺' },
        cmpxuqtby002l26795d832uaw: { Plane: '✈️', Train: '🚂', Boat: '⛵', Car: '🚗', Bus: '🚌', Bicycle: '🚲' },
        cmpxuqtc5002w267949u4b8a3: { Lobby: '🏨', Elevator: '🛗', Luggage: '🧳', 'Room Key': '🗝️', Pool: '🏊', Reception: '💁' },
        cmpxuqtca00372679wpyvb8n0: { Menu: '📋', Waiter: '🤵', Appetizer: '🥗', 'Main Course': '🍖', Dessert: '🍰', Bill: '🧾' },
        cmpxuqtch003i2679bwgrbmah: { Apologize: '🙏', Complaint: '😤', Fix: '🔧', Manager: '👔', Refund: '💰', Solution: '✅' },
        cmpxuqtcm003t267921rd8lpa: { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Swimming: '🏊', Cycling: '🚴', Boxing: '🥊' },
        cmpxuqtcs004426790u12anw1: { 'Eiffel Tower': '🗼', Pyramid: '🔺', 'Cruise Ship': '🚢', 'National Park': '🌲', 'Amusement Park': '🎡', Zoo: '🦁' },
        cmpxuqtd0004f2679fqfj3vl2: { English: '🇬🇧', French: '🇫🇷', Arabic: '🇸🇦', Swahili: '🌍', Malagasy: '🇲🇬', Hindi: '🇮🇳' },
      }

      const lessons = await prisma.lesson.findMany({
        where: { id: { in: Object.keys(EMOJIS) } },
        select: { id: true, content: true },
      })

      const toUpdate = lessons.filter((l) => {
        const cards: any[] = (l.content as any)?.cards ?? []
        return cards.some((c: any) => !c.emoji)
      })

      if (toUpdate.length === 0) return

      await prisma.$transaction(
        toUpdate.map((l) => {
          const emojiMap = EMOJIS[l.id] ?? {}
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
      console.log(`[migrate] M003 applied to ${toUpdate.length} lessons`)
    },
  },

  // ── M004: Word match emojis — refresh to latest curated set (2026-07-02) ───
  {
    id: 'M004-word-match-emojis-refresh-20260702',
    run: async () => {
      const EMOJIS: Record<string, Record<string, string>> = {
        cmpxuqtao000g2679u2sajc4h: { Birthday: '🎂', Eyes: '👀', Hair: '💇', Height: '📏', Passion: '❤️', Gender: '🧍' },
        cmpxuqtaw000r2679sx40hcrn: { Breakfast: '🍳', Lunch: '🥙', Dinner: '🍲', Snack: '🍎', Dessert: '🍰', Drink: '🧃' },
        cmpxuqtb100122679pmuhso3w: { Dog: '🐕', Cat: '🐈', Lemur: '🐒', Dolphin: '🐬', Whale: '🐋', Parrot: '🦜' },
        cmpxuqtb9001d2679i5rt8bbu: { Friend: '🤝', Surprise: '🎉', Argument: '😤', Music: '🎵', School: '🏫', Together: '👥' },
        cmpxuqtbf001o2679x9unc9cd: { Dancing: '💃', Reading: '📚', Cooking: '👨‍🍳', Swimming: '🏊', Drawing: '🎨', Sports: '⚽' },
        cmpxuqtbo001z2679iku5bb62: { Beach: '🏖️', Mountains: '⛰️', Market: '🏪', Museum: '🏛️', Temple: '⛩️', Stadium: '🏟️' },
        cmpxuqtbt002a2679ennxsncc: { Hiking: '🥾', Swimming: '🏊', Reading: '📖', Cycling: '🚴', Camping: '⛺', Picnic: '🧺' },
        cmpxuqtby002l26795d832uaw: { Plane: '✈️', Train: '🚂', Boat: '🚢', Car: '🚗', Bus: '🚌', Bicycle: '🚲' },
        cmpxuqtc5002w267949u4b8a3: { Lobby: '🏛️', Elevator: '🛗', Luggage: '🧳', 'Room Key': '🗝️', Pool: '🏊', Reception: '🛎️' },
        cmpxuqtca00372679wpyvb8n0: { Menu: '📋', Waiter: '🤵', Appetizer: '🥗', 'Main Course': '🍽️', Dessert: '🍰', Bill: '💳' },
        cmpxuqtch003i2679bwgrbmah: { Apologize: '🙏', Complaint: '😠', Fix: '🔧', Manager: '👔', Refund: '💰', Solution: '✅' },
        cmpxuqtcm003t267921rd8lpa: { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Swimming: '🏊', Cycling: '🚴', Boxing: '🥊' },
        cmpxuqtcs004426790u12anw1: { 'Eiffel Tower': '🗼', Pyramid: '🔺', 'Cruise Ship': '🛳️', 'National Park': '🏞️', 'Amusement Park': '🎡', Zoo: '🦁' },
        cmpxuqtd0004f2679fqfj3vl2: { English: '🇬🇧', French: '🇫🇷', Arabic: '🇸🇦', Swahili: '🇰🇪', Malagasy: '🇲🇬', Hindi: '🇮🇳' },
      }

      const lessons = await prisma.lesson.findMany({
        where: { id: { in: Object.keys(EMOJIS) } },
        select: { id: true, content: true },
      })

      const toUpdate = lessons.filter((l) => {
        const emojiMap = EMOJIS[l.id] ?? {}
        const cards: any[] = (l.content as any)?.cards ?? []
        return cards.some((c: any) => emojiMap[c.correctWord] && emojiMap[c.correctWord] !== c.emoji)
      })

      if (toUpdate.length === 0) return

      await prisma.$transaction(
        toUpdate.map((l) => {
          const emojiMap = EMOJIS[l.id] ?? {}
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
      console.log(`[migrate] M004 applied to ${toUpdate.length} lessons`)
    },
  },

  // ── M005: Seed real Terms/Privacy content — only if never customized ────────
  // Does NOT overwrite content an admin has already saved via the Legal editor;
  // it only fills in the LegalContent rows the first time they're missing, so
  // production gets the real copy instead of relying purely on code fallback.
  {
    id: 'M005-legal-content-defaults',
    run: async () => {
      const [terms, privacy] = await Promise.all([
        prisma.legalContent.findUnique({ where: { type: 'terms' } }),
        prisma.legalContent.findUnique({ where: { type: 'privacy' } }),
      ])

      if (!terms) {
        await prisma.legalContent.create({
          data: { type: 'terms', sections: DEFAULT_TERMS },
        })
        console.log('[migrate] M005 seeded default Terms of Use')
      }

      if (!privacy) {
        await prisma.legalContent.create({
          data: { type: 'privacy', sections: DEFAULT_PRIVACY },
        })
        console.log('[migrate] M005 seeded default Privacy Policy')
      }
    },
  },

]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('[migrate] Running data migrations...')
  for (const m of migrations) {
    try {
      await m.run()
    } catch (err) {
      console.error(`[migrate] ${m.id} FAILED:`, err)
      process.exit(1)
    }
  }
  console.log('[migrate] All data migrations complete.')
  await prisma.$disconnect()
}

main()
