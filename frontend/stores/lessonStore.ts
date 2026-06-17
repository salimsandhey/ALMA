import { create } from 'zustand'

interface CardResult {
  cardId: string
  correct: boolean
  xpEarned: number
  helpUsed?: boolean
}

interface LessonData {
  id: string
  moduleId: string
  title: string
  gameType: string
  xpReward: number
  content: any
  isCompleted: boolean
}

interface LessonState {
  lesson: LessonData | null
  currentCardIndex: number
  cardResults: CardResult[]
  totalXpEarned: number
  isComplete: boolean
  init: (lesson: LessonData) => void
  nextCard: () => void
  prevCard: () => void
  recordResult: (cardId: string, correct: boolean, xp: number, helpUsed?: boolean) => void
  reset: () => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lesson: null,
  currentCardIndex: 0,
  cardResults: [],
  totalXpEarned: 0,
  isComplete: false,
  init: (lesson) => set({ lesson, currentCardIndex: 0, cardResults: [], totalXpEarned: 0, isComplete: false }),
  nextCard: () => {
    const { lesson, currentCardIndex } = get()
    const cards = lesson?.content?.cards ?? []
    if (currentCardIndex >= cards.length - 1) {
      set({ isComplete: true })
    } else {
      set({ currentCardIndex: currentCardIndex + 1 })
    }
  },
  prevCard: () => set((s) => ({ currentCardIndex: Math.max(0, s.currentCardIndex - 1) })),
  recordResult: (cardId, correct, xp, helpUsed) => set((s) => {
    const existing = s.cardResults.find((r) => r.cardId === cardId)
    const entry = { cardId, correct, xpEarned: xp, helpUsed }
    const updated = existing
      ? s.cardResults.map((r) => r.cardId === cardId ? entry : r)
      : [...s.cardResults, entry]
    const totalXpEarned = updated.reduce((sum, r) => sum + r.xpEarned, 0)
    return { cardResults: updated, totalXpEarned }
  }),
  reset: () => set({ lesson: null, currentCardIndex: 0, cardResults: [], totalXpEarned: 0, isComplete: false }),
}))
