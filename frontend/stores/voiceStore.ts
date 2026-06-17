import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Speech from 'expo-speech'

export type VoiceGender = 'female' | 'male'

const STORAGE_KEY = 'alma_voice_gender'

// Ordered preference lists — first match on device wins
const MALE_VOICE_NAMES = ['alex', 'fred', 'tom', 'daniel', 'oliver', 'arthur', 'aaron', 'gordon', 'ralph', 'albert']
const FEMALE_VOICE_NAMES = ['samantha', 'ava', 'victoria', 'karen', 'moira', 'tessa', 'allison', 'susan', 'zoe', 'fiona', 'kathy', 'vicki']

interface VoiceState {
  voiceGender: VoiceGender
  resolvedVoices: { male: string | null; female: string | null }
  setVoiceGender: (gender: VoiceGender) => void
  loadVoiceGender: () => Promise<void>
  resolveVoices: () => Promise<void>
}

function pickVoice(voices: Speech.Voice[], preferredNames: string[], genderHint: string): string | null {
  const enVoices = voices.filter((v) => v.language?.toLowerCase().startsWith('en'))

  for (const name of preferredNames) {
    const match = enVoices.find((v) => v.name?.toLowerCase().includes(name))
    if (match) return match.identifier
  }

  // Android identifiers often contain 'male' / 'female'
  const byId = enVoices.find((v) => v.identifier?.toLowerCase().includes(genderHint))
  if (byId) return byId.identifier

  return null
}

export const useVoiceStore = create<VoiceState>((set) => ({
  voiceGender: 'female',
  resolvedVoices: { male: null, female: null },

  setVoiceGender: (gender) => {
    set({ voiceGender: gender })
    AsyncStorage.setItem(STORAGE_KEY, gender)
  },

  loadVoiceGender: async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY)
    if (saved === 'male' || saved === 'female') set({ voiceGender: saved })
  },

  resolveVoices: async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync()
      if (!voices || voices.length === 0) return

      const male = pickVoice(voices, MALE_VOICE_NAMES, 'male')
      const female = pickVoice(voices, FEMALE_VOICE_NAMES, 'female')

      // Only store if we found two distinct voices — otherwise fall back to pitch-shift
      if (male && female && male !== female) {
        set({ resolvedVoices: { male, female } })
      }
    } catch {
      // Device voice query failed — pitch-shift fallback remains active
    }
  },
}))

export function getSpeakOptions(gender: VoiceGender): Speech.SpeechOptions {
  const { resolvedVoices } = useVoiceStore.getState()
  const voiceId = gender === 'male' ? resolvedVoices.male : resolvedVoices.female

  if (voiceId) {
    // Actual different device voices — use natural rate, no pitch manipulation needed
    return gender === 'male'
      ? { language: 'en-US', pitch: 1.0, rate: 0.85, voice: voiceId }
      : { language: 'en-US', pitch: 1.0, rate: 0.95, voice: voiceId }
  }

  // Fallback: same voice, differentiate by pitch
  return gender === 'male'
    ? { language: 'en-US', pitch: 1.0, rate: 0.85 }
    : { language: 'en-US', pitch: 1.65, rate: 0.95 }
}
