/**
 * One-time script: update all Language.label values to their English names.
 * Run with:  npx ts-node scripts/fix-language-labels.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ISO 639-1 code → English display name
const ENGLISH_NAMES: Record<string, string> = {
  af: 'Afrikaans', sq: 'Albanian', am: 'Amharic', ar: 'Arabic', hy: 'Armenian',
  az: 'Azerbaijani', eu: 'Basque', be: 'Belarusian', bn: 'Bengali', bs: 'Bosnian',
  bg: 'Bulgarian', ca: 'Catalan', ceb: 'Cebuano', zh: 'Chinese', co: 'Corsican',
  hr: 'Croatian', cs: 'Czech', da: 'Danish', nl: 'Dutch', en: 'English',
  eo: 'Esperanto', et: 'Estonian', fi: 'Finnish', fr: 'French', fy: 'Frisian',
  gl: 'Galician', ka: 'Georgian', de: 'German', el: 'Greek', gu: 'Gujarati',
  ht: 'Haitian Creole', ha: 'Hausa', he: 'Hebrew', hi: 'Hindi', hmn: 'Hmong',
  hu: 'Hungarian', is: 'Icelandic', ig: 'Igbo', id: 'Indonesian', ga: 'Irish',
  it: 'Italian', ja: 'Japanese', jv: 'Javanese', kn: 'Kannada', kk: 'Kazakh',
  km: 'Khmer', rw: 'Kinyarwanda', ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz',
  lo: 'Lao', la: 'Latin', lv: 'Latvian', lt: 'Lithuanian', lb: 'Luxembourgish',
  mk: 'Macedonian', mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam', mt: 'Maltese',
  mi: 'Maori', mr: 'Marathi', mn: 'Mongolian', my: 'Burmese', ne: 'Nepali',
  no: 'Norwegian', ny: 'Chichewa', or: 'Odia', ps: 'Pashto', fa: 'Persian',
  pl: 'Polish', pt: 'Portuguese', pa: 'Punjabi', ro: 'Romanian', ru: 'Russian',
  sm: 'Samoan', gd: 'Scottish Gaelic', sr: 'Serbian', st: 'Sesotho', sn: 'Shona',
  sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', so: 'Somali',
  es: 'Spanish', su: 'Sundanese', sw: 'Swahili', sv: 'Swedish', tl: 'Filipino',
  tg: 'Tajik', ta: 'Tamil', tt: 'Tatar', te: 'Telugu', th: 'Thai', tr: 'Turkish',
  tk: 'Turkmen', uk: 'Ukrainian', ur: 'Urdu', ug: 'Uyghur', uz: 'Uzbek',
  vi: 'Vietnamese', cy: 'Welsh', xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba',
  zu: 'Zulu',
}

async function main() {
  const languages = await prisma.language.findMany()
  console.log(`Found ${languages.length} languages`)

  let updated = 0
  let skipped = 0

  for (const lang of languages) {
    const englishName = ENGLISH_NAMES[lang.code]
    if (!englishName) {
      console.log(`  SKIP  [${lang.code}] — no English name mapping (current: "${lang.label}")`)
      skipped++
      continue
    }
    if (lang.label === englishName) {
      console.log(`  OK    [${lang.code}] already "${englishName}"`)
      continue
    }
    await prisma.language.update({
      where: { code: lang.code },
      data: { label: englishName },
    })
    console.log(`  FIX   [${lang.code}] "${lang.label}" → "${englishName}"`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
