/**
 * Run once to pre-generate TTS audio for all static content.
 * Usage: npx ts-node --transpile-only src/scripts/generate-static-audio.ts
 *
 * Generates male + female MP3s for:
 *   - DailyChallenge questions and sample answers
 *   - Dialogue lesson guest lines
 */

import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../lib/prisma'
import { getOrGenerateTtsAudio } from '../lib/tts'

interface DialogueTurn {
  speaker: 'GUEST' | 'USER'
  text: string | null
  expectedResponse: string | null
}

interface LessonContent {
  cards?: Array<{ turns?: DialogueTurn[] }>
}

async function generate() {
  const texts = new Set<string>()

  // ── 1. Daily challenges ───────────────────────────────────────────────────
  const challenges = await prisma.dailyChallenge.findMany({
    select: { question: true, sampleAnswer: true },
  })
  for (const c of challenges) {
    texts.add(c.question.trim())
    texts.add(c.sampleAnswer.trim())
  }

  // ── 2. Dialogue lesson guest lines ────────────────────────────────────────
  const dialogueLessons = await prisma.lesson.findMany({
    where: { gameType: 'DIALOGUE' },
    select: { content: true },
  })
  for (const lesson of dialogueLessons) {
    const content = lesson.content as LessonContent
    for (const card of content.cards ?? []) {
      for (const turn of card.turns ?? []) {
        if (turn.speaker === 'GUEST' && turn.text) {
          texts.add(turn.text.trim())
        }
      }
    }
  }

  const total = texts.size
  console.log(`Found ${total} unique texts to generate audio for.`)

  let done = 0
  let skipped = 0
  let failed = 0

  for (const text of texts) {
    try {
      const result = await getOrGenerateTtsAudio(text)
      // getOrGenerateTtsAudio logs cache hits internally; count as done either way
      done++
      if (done % 10 === 0 || done === total) {
        console.log(`Progress: ${done}/${total} (${failed} failed, ${skipped} skipped)`)
      }
    } catch (err) {
      failed++
      console.error(`FAILED [${text.slice(0, 60)}]:`, err)
    }
  }

  console.log(`\nDone. ${done} succeeded, ${failed} failed out of ${total} texts.`)
  await prisma.$disconnect()
}

generate().catch((err) => {
  console.error('Script failed:', err)
  process.exit(1)
})
