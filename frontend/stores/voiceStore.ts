import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Speech from 'expo-speech'

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

// Both use en-US so the same base voice is used on the device.
// Male  → natural pitch (device's default en-US voice, which tends to be male)
// Female → significantly raised pitch to sound distinctly female
export function getSpeakOptions(gender: VoiceGender): Speech.SpeechOptions {
  return gender === 'male'
    ? { language: 'en-US', pitch: 1.0, rate: 0.85 }
    : { language: 'en-US', pitch: 1.65, rate: 0.95 }
}
