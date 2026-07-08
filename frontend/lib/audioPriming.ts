import { Audio } from 'expo-av'

// A ~50ms silent WAV, embedded directly so no extra asset file is needed.
const SILENT_WAV_URI =
  'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'

// On Android, expo-speech-recognition delegates to the OS's own built-in
// SpeechRecognizer, which manages audio focus internally with no JS-visible
// signal for exactly when it finishes handing focus back. Playing this
// silent sound first forces Android to fully resolve that handoff — more
// reliable than a blind delay, which is just a guess at how long that takes.
export async function primeAndroidAudioSession(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: SILENT_WAV_URI },
      { volume: 0, shouldPlay: true }
    )
    await new Promise<void>((resolve) => setTimeout(resolve, 120))
    await sound.stopAsync().catch(() => {})
    await sound.unloadAsync().catch(() => {})
  } catch {
    // Best-effort — if priming fails for any reason, just continue.
  }
}
