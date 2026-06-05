/**
 * Uploads bundled lesson images to Cloudinary and updates DB content JSON.
 * Run once: npx ts-node src/scripts/migrate-lesson-images.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { uploadLessonImage } from '../lib/cloudinary'

const prisma = new PrismaClient()

const ASSETS_ROOT = path.resolve(__dirname, '../../../frontend/assets/lessons')

// local:key → relative path from ASSETS_ROOT
const LOCAL_IMAGE_MAP: Record<string, string> = {
  'local:pi-keywords-name':         'personal-information/keywords/Name.png',
  'local:pi-keywords-age':          'personal-information/keywords/Age.png',
  'local:pi-keywords-hometown':     'personal-information/keywords/Hometown.png',
  'local:pi-keywords-mother-tongue':'personal-information/keywords/Mother tongue.png',
  'local:pi-keywords-dream-job':    'personal-information/keywords/Dream job.png',
  'local:fd-words-breakfast':       'food-and-drink/words/Breakfast.png',
  'local:fd-words-vegetables':      'food-and-drink/words/Vegetables.png',
  'local:fd-words-spicy':           'food-and-drink/words/Spicy.png',
  'local:fd-words-dessert':         'food-and-drink/words/Dessert.png',
  'local:fd-words-recipe':          'food-and-drink/words/Recipe.png',
}

async function run() {
  // Step 1 — upload each image to Cloudinary
  console.log('Uploading images to Cloudinary...\n')
  const urlMap: Record<string, string> = {}

  for (const [localKey, relativePath] of Object.entries(LOCAL_IMAGE_MAP)) {
    const filePath = path.join(ASSETS_ROOT, relativePath)
    if (!fs.existsSync(filePath)) {
      console.warn(`  SKIP (file not found): ${filePath}`)
      continue
    }
    const buffer = fs.readFileSync(filePath)
    const publicId = localKey.replace('local:', '').replace(/:/g, '_')
    try {
      const url = await uploadLessonImage(buffer, publicId)
      urlMap[localKey] = url
      console.log(`  ✓ ${localKey} → ${url}`)
    } catch (err) {
      console.error(`  ✗ Failed to upload ${localKey}:`, err)
    }
  }

  if (Object.keys(urlMap).length === 0) {
    console.log('\nNo images uploaded. Exiting.')
    return
  }

  // Step 2 — update lesson content in DB
  console.log('\nUpdating lesson content in DB...\n')
  const lessons = await prisma.lesson.findMany()
  let updated = 0

  for (const lesson of lessons) {
    let contentStr = JSON.stringify(lesson.content)
    let changed = false

    for (const [localKey, cloudUrl] of Object.entries(urlMap)) {
      if (contentStr.includes(localKey)) {
        contentStr = contentStr.split(localKey).join(cloudUrl)
        changed = true
      }
    }

    if (changed) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: JSON.parse(contentStr) },
      })
      console.log(`  ✓ Updated lesson: ${lesson.title}`)
      updated++
    }
  }

  console.log(`\nDone. ${updated} lesson(s) updated.`)
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
