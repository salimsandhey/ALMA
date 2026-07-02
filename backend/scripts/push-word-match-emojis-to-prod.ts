/**
 * One-time sync: copy the current Word Match card emojis from the LOCAL
 * database (as edited via the admin "Word Match Emojis" screen) into the
 * PRODUCTION database, for the same set of lesson IDs.
 *
 * Run with:
 *   PROD_DATABASE_URL="postgresql://..." npx ts-node scripts/push-word-match-emojis-to-prod.ts
 *
 * PROD_DATABASE_URL must be passed inline — never store the production
 * connection string in a committed .env file.
 */
import { PrismaClient } from '@prisma/client'
import { WORD_MATCH_EMOJIS } from '../src/data/wordMatchEmojis'

const prodUrl = process.env.PROD_DATABASE_URL
if (!prodUrl) {
  console.error('Missing PROD_DATABASE_URL. Run as:\n  PROD_DATABASE_URL="..." npx ts-node scripts/push-word-match-emojis-to-prod.ts')
  process.exit(1)
}

const localPrisma = new PrismaClient() // uses DATABASE_URL from backend/.env (local)
const prodPrisma = new PrismaClient({ datasources: { db: { url: prodUrl } } })

async function main() {
  const lessonIds = Object.keys(WORD_MATCH_EMOJIS)

  const localLessons = await localPrisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true, content: true },
  })

  // Build overrides from whatever emoji is currently saved locally per card
  const overrides: Record<string, Record<string, string>> = {}
  for (const l of localLessons) {
    const cards = (l.content as any)?.cards ?? []
    overrides[l.id] = {}
    for (const c of cards) {
      if (c.emoji) overrides[l.id][c.correctWord] = c.emoji
    }
  }

  const prodLessons = await prodPrisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true, content: true },
  })

  if (prodLessons.length !== localLessons.length) {
    console.warn(
      `Warning: found ${localLessons.length} matching lessons locally but ${prodLessons.length} in production. ` +
      `Lesson IDs may not match between environments — double check before proceeding.`
    )
  }

  await prodPrisma.$transaction(
    prodLessons.map((l) => {
      const emojiMap = { ...(WORD_MATCH_EMOJIS[l.id] ?? {}), ...(overrides[l.id] ?? {}) }
      const cards = ((l.content as any)?.cards ?? []).map((c: any) => ({
        ...c,
        emoji: emojiMap[c.correctWord] ?? c.emoji ?? '❓',
      }))
      return prodPrisma.lesson.update({
        where: { id: l.id },
        data: { content: { ...(l.content as any), cards } },
      })
    })
  )

  console.log(`Done. Pushed emoji updates to ${prodLessons.length} lessons in production.`)
  prodLessons.forEach((l) => console.log(`  - ${l.title}`))
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  })
