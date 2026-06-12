import crypto from 'crypto'
import cloudinary, { uploadTTSAudio } from '../lib/cloudinary'

const KOKORO_URL = process.env.KOKORO_URL ?? 'http://kokoro:8880'

const VOICE_IDS = {
  female: 'af_heart',
  male: 'am_michael',
} as const

function cacheKey(text: string, voice: string): string {
  return crypto.createHash('sha256').update(`${voice}:${text}`).digest('hex').slice(0, 40)
}

async function getCachedUrl(publicId: string): Promise<string | null> {
  try {
    const result = await cloudinary.api.resource(`alma/tts/${publicId}`, { resource_type: 'video' })
    return (result.secure_url as string) ?? null
  } catch {
    return null
  }
}

export async function getTTSAudio(text: string, voice: 'female' | 'male'): Promise<string> {
  const key = cacheKey(text, voice)

  const cached = await getCachedUrl(key)
  if (cached) {
    console.log(`[tts] cache hit for key ${key.slice(0, 8)}…`)
    return cached
  }

  console.log(`[tts] calling Kokoro at ${KOKORO_URL} voice=${VOICE_IDS[voice]}`)

  const response = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kokoro',
      input: text,
      voice: VOICE_IDS[voice],
      response_format: 'mp3',
      speed: 0.9,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Kokoro HTTP ${response.status}: ${body.slice(0, 200)}`)
  }

  console.log(`[tts] Kokoro responded OK, uploading to Cloudinary…`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const url = await uploadTTSAudio(buffer, key)
  console.log(`[tts] cached at ${url.slice(0, 60)}…`)
  return url
}
