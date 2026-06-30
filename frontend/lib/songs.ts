export type Song = {
  id: string
  title: string
  artist: string
  genre: string
  emoji: string
  youtubeUrl: string
  bgMusicUrl?: string | null
  lyrics: string[]
}

export type LineResult = {
  line: string
  score: number
  spoken: string
}
