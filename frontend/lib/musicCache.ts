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

// Returns the cached path for the app-wide default karaoke track, or null if
// no admin-uploaded default exists or it hasn't been downloaded yet.
export async function getCachedDefaultBgMusicPath(): Promise<string | null> {
  const { data } = await api.get('/api/music/songs')
  const url: string | null = data.defaultBgMusicUrl ?? null
  if (!url) return null
  return getCachedBgMusicPath(url)
}

// Returns songs' background music files (including the app-wide default
// track, if an admin has uploaded one) that aren't cached locally yet.
export async function getMissingSongBgMusicFiles(): Promise<Array<{ url: string; path: string }>> {
  await ensureDir()

  const { data } = await api.get('/api/music/songs')
  const songs: Array<{ bgMusicUrl?: string | null }> = data.songs ?? []
  const defaultUrl: string | null = data.defaultBgMusicUrl ?? null
  const urls = [...new Set([
    ...songs.map((s) => s.bgMusicUrl).filter((u): u is string => !!u),
    ...(defaultUrl ? [defaultUrl] : []),
  ])]

  const toDownload: Array<{ url: string; path: string }> = []
  for (const url of urls) {
    const hash = await urlToHash(url)
    const path = localPath(hash)
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) toDownload.push({ url, path })
  }
  return toDownload
}
