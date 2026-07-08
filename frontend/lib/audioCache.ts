import * as FileSystem from 'expo-file-system/legacy'
import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import { api } from './api'
import { getMissingSongBgMusicFiles } from './musicCache'

const AUDIO_DIR = FileSystem.cacheDirectory + 'alma_tts/'

// ─── Progress store ───────────────────────────────────────────────────────────

type DownloadState = {
  total: number
  downloaded: number
  status: 'idle' | 'downloading' | 'done'
  setProgress: (downloaded: number, total: number) => void
  setDone: () => void
  reset: () => void
}

export const useAudioDownloadStore = create<DownloadState>((set) => ({
  total: 0,
  downloaded: 0,
  status: 'idle',
  setProgress: (downloaded, total) => set({ downloaded, total, status: 'downloading' }),
  setDone: () => set({ status: 'done' }),
  reset: () => set({ total: 0, downloaded: 0, status: 'idle' }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(AUDIO_DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true })
}

async function textToHash(text: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text.trim().toLowerCase()
  )
}

function localPath(hash: string, gender: 'male' | 'female'): string {
  return `${AUDIO_DIR}${hash}_${gender}.mp3`
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Returns a playable URI — local file if cached, otherwise downloads first
export async function getAudioUri(text: string, gender: 'male' | 'female'): Promise<string> {
  const hash = await textToHash(text)
  const path = localPath(hash, gender)

  const info = await FileSystem.getInfoAsync(path)
  if (info.exists) return path

  await ensureDir()
  const { data } = await api.post('/api/tts', { text, gender })
  await FileSystem.downloadAsync(data.audioUrl, path)
  return path
}

// Returns static (voice-line) audio files that aren't cached locally yet.
async function getMissingStaticAudioFiles(): Promise<Array<{ url: string; path: string }>> {
  await ensureDir()

  const { data } = await api.get('/api/tts/manifest')
  const items: Array<{ textHash: string; audioUrlMale: string; audioUrlFemale: string }> =
    data.items ?? []

  const toDownload: Array<{ url: string; path: string }> = []
  for (const item of items) {
    for (const gender of ['male', 'female'] as const) {
      const path = localPath(item.textHash, gender)
      const info = await FileSystem.getInfoAsync(path)
      if (!info.exists) {
        toDownload.push({
          url: gender === 'male' ? item.audioUrlMale : item.audioUrlFemale,
          path,
        })
      }
    }
  }
  return toDownload
}

// Downloads all static voice-line audio and song backing tracks in the
// background, reporting combined progress. Safe to call on every app boot —
// only shows/updates progress when there's actually something to fetch.
export async function downloadAllOfflineContent(): Promise<void> {
  const store = useAudioDownloadStore.getState()

  const [staticAudio, songBgMusic] = await Promise.all([
    getMissingStaticAudioFiles(),
    getMissingSongBgMusicFiles(),
  ])
  const toDownload = [...staticAudio, ...songBgMusic]

  if (toDownload.length === 0) {
    store.reset()
    return
  }

  store.setProgress(0, toDownload.length)

  let done = 0
  const BATCH = 8
  for (let i = 0; i < toDownload.length; i += BATCH) {
    await Promise.all(
      toDownload.slice(i, i + BATCH).map(async ({ url, path }) => {
        await FileSystem.downloadAsync(url, path).catch(() => {})
        done++
        store.setProgress(done, toDownload.length)
      })
    )
  }

  store.setDone()
}
