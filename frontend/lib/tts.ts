import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { api } from './api'
import { getSpeakOptions } from '../stores/voiceStore'

// Session-level cache: avoids hitting the backend for the same text twice
const urlCache = new Map<string, string>()

async function fetchTTSUrl(text: string, voice: 'female' | 'male'): Promise<string> {
  const key = `${voice}:${text}`
  const hit = urlCache.get(key)
  if (hit) return hit
  const { data } = await api.post<{ url: string }>('/api/tts', { text, voice })
  urlCache.set(key, data.url)
  return data.url
}

export type PlayState = 'idle' | 'loading' | 'playing'
export type TTSSource = 'kokoro' | 'device'

export async function playTTS(
  text: string,
  voice: 'female' | 'male',
  onStateChange: (s: PlayState) => void,
  onSource?: (src: TTSSource) => void
): Promise<() => void> {
  onStateChange('loading')

  let sound: Audio.Sound | null = null
  let cancelled = false

  const cancel = () => {
    cancelled = true
    if (sound) {
      sound.stopAsync().catch(() => {})
      sound.unloadAsync().catch(() => {})
    } else {
      Speech.stop()
    }
    onStateChange('idle')
  }

  try {
    const url = await fetchTTSUrl(text, voice)
    if (cancelled) return cancel

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    const { sound: loaded } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    )
    sound = loaded

    if (cancelled) {
      loaded.unloadAsync().catch(() => {})
      return cancel
    }

    onSource?.('kokoro')
    onStateChange('playing')

    loaded.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return
      if (status.didJustFinish) {
        loaded.unloadAsync().catch(() => {})
        onStateChange('idle')
      }
    })
  } catch {
    // Kokoro unavailable — fall back to device TTS
    if (!cancelled) {
      onSource?.('device')
      onStateChange('playing')
      Speech.speak(text, {
        ...getSpeakOptions(voice),
        onDone: () => onStateChange('idle'),
        onError: () => onStateChange('idle'),
      })
    }
  }

  return cancel
}
