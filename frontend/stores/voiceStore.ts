import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type VoiceGender = 'female' | 'male'

const STORAGE_KEY = 'alma_voice_gender'

interface VoiceState {
  voiceGender: VoiceGender
  setVoiceGender: (gender: VoiceGender) => void
  loadVoiceGender: () => Promise<void>
}

export const useVoiceStore = create<VoiceState>((set) => ({
  voiceGender: 'female',

  setVoiceGender: (gender) => {
    set({ voiceGender: gender })
    AsyncStorage.setItem(STORAGE_KEY, gender)
  },

  loadVoiceGender: async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY)
    if (saved === 'male' || saved === 'female') set({ voiceGender: saved })
  },
}))
