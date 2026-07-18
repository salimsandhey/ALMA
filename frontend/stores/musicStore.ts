import { create } from 'zustand'
import { Song, LineResult } from '../lib/songs'

interface MusicState {
  currentSong: Song | null
  currentLineIndex: number
  lineResults: LineResult[]
  isComplete: boolean
  xpAwarded: boolean
  startKaraoke: (song: Song) => void
  updateSongData: (song: Song) => void
  recordLineResult: (result: LineResult) => void
  nextLine: () => void
  setXpAwarded: (awarded: boolean) => void
  reset: () => void
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentSong: null,
  currentLineIndex: 0,
  lineResults: [],
  isComplete: false,
  xpAwarded: false,

  startKaraoke: (song) => set({
    currentSong: song,
    currentLineIndex: 0,
    lineResults: [],
    isComplete: false,
    xpAwarded: false,
  }),

  // Refreshes the current song's content (e.g. a newly uploaded bgMusicUrl)
  // without touching in-progress karaoke state (line index, results so far).
  updateSongData: (song) => set((s) =>
    s.currentSong?.id === song.id ? { currentSong: song } : s
  ),

  recordLineResult: (result) => set((s) => ({
    lineResults: [...s.lineResults, result],
  })),

  nextLine: () => {
    const { currentSong, currentLineIndex } = get()
    if (!currentSong) return
    const lines = currentSong.lyrics
    if (currentLineIndex >= lines.length - 1) {
      set({ isComplete: true })
    } else {
      set({ currentLineIndex: currentLineIndex + 1 })
    }
  },

  setXpAwarded: (awarded) => set({ xpAwarded: awarded }),

  reset: () => set({
    currentSong: null,
    currentLineIndex: 0,
    lineResults: [],
    isComplete: false,
    xpAwarded: false,
  }),
}))
