/**
 * Backfills missing `id` fields on lesson content cards in the DB.
 * Safe to run multiple times — only patches cards that have no id.
 *
 * Dry-run (no DB writes):  npx ts-node src/scripts/backfill-card-ids.ts --check
 * Apply fixes:             npx ts-node src/scripts/backfill-card-ids.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--check')

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

async function main() {
  if (dryRun) console.log('DRY RUN — no changes will be written.\n')

  const lessons = await prisma.lesson.findMany({ select: { id: true, title: true, content: true } })
  console.log(`Scanning ${lessons.length} lessons...\n`)

  let affectedLessons = 0
  let missingIds = 0

  for (const lesson of lessons) {
    const content = lesson.content as any
    const cards: any[] = content?.cards ?? []

    const missing = cards.filter((c) => !c.id)
    if (missing.length === 0) continue

    missingIds += missing.length
    affectedLessons++
    console.log(`  [${dryRun ? 'NEEDS FIX' : 'PATCHING'}] "${lesson.title}" (${lesson.id}) — ${missing.length} card(s) missing id`)

    if (!dryRun) {
      for (const card of cards) {
        if (!card.id) card.id = uid()
      }
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: { ...content, cards } },
      })
    }
  }

  if (missingIds === 0) {
    console.log('All cards already have ids. Nothing to do.')
  } else if (dryRun) {
    console.log(`\nFound ${missingIds} card(s) without ids across ${affectedLessons} lesson(s).`)
    console.log('Run without --check to apply the fix.')
  } else {
    console.log(`\nDone. Patched ${missingIds} card(s) across ${affectedLessons} lesson(s).`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
