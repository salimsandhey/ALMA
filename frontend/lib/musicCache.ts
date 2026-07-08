import * as FileSystem from 'expo-file-system/legacy'
import * as Crypto from 'expo-crypto'
import { api } from './api'

const MUSIC_DIR = FileSystem.cacheDirectory + 'alma_music/'

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(MUSIC_DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true })
}

async function urlToHash(url: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url)
}

function localPath(hash: string): string {
  return `${MUSIC_DIR}${hash}.mp3`
}

// Returns the local cached file for a song's bg music, or null if not downloaded yet.
// Keyed by a hash of the URL itself, so if an admin swaps a song's track for a new
// file (new URL), this naturally misses the old cache entry and re-downloads.
export async function getCachedBgMusicPath(url: string): Promise<string | null> {
  const hash = await urlToHash(url)
  const path = localPath(hash)
  const info = await FileSystem.getInfoAsync(path)
  return info.exists ? path : null
}

// Returns songs' background music files that aren't cached locally yet.
export async function getMissingSongBgMusicFiles(): Promise<Array<{ url: string; path: string }>> {
  await ensureDir()

  const { data } = await api.get('/api/music/songs')
  const songs: Array<{ bgMusicUrl?: string | null }> = data.songs ?? []
  const urls = [...new Set(songs.map((s) => s.bgMusicUrl).filter((u): u is string => !!u))]

  const toDownload: Array<{ url: string; path: string }> = []
  for (const url of urls) {
    const hash = await urlToHash(url)
    const path = localPath(hash)
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) toDownload.push({ url, path })
  }
  return toDownload
}
