import crypto from 'crypto'
import cloudinary from './cloudinary'
import { prisma } from './prisma'

const MALE_VOICE = 'en-US-Neural2-D'
const FEMALE_VOICE = 'en-US-Neural2-F'

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex')
}

async function callGoogleTTS(text: string, voiceName: string): Promise<Buffer> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google TTS error ${res.status}: ${err}`)
  }
  const json = (await res.json()) as { audioContent: string }
  return Buffer.from(json.audioContent, 'base64')
}

async function uploadAudioToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'alma/tts', public_id: publicId, resource_type: 'video', format: 'mp3', overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

export async function getOrGenerateTtsAudio(
  text: string
): Promise<{ audioUrlMale: string; audioUrlFemale: string }> {
  const hash = hashText(text)

  const cached = await prisma.ttsAudioCache.findUnique({ where: { textHash: hash } })
  if (cached) return { audioUrlMale: cached.audioUrlMale, audioUrlFemale: cached.audioUrlFemale }

  const [maleBuffer, femaleBuffer] = await Promise.all([
    callGoogleTTS(text, MALE_VOICE),
    callGoogleTTS(text, FEMALE_VOICE),
  ])

  const [audioUrlMale, audioUrlFemale] = await Promise.all([
    uploadAudioToCloudinary(maleBuffer, `${hash}_male`),
    uploadAudioToCloudinary(femaleBuffer, `${hash}_female`),
  ])

  await prisma.ttsAudioCache.create({
    data: { textHash: hash, text: text.trim(), audioUrlMale, audioUrlFemale },
  })

  return { audioUrlMale, audioUrlFemale }
}
