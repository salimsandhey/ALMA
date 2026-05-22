export type SpeechEventName =
  | 'mic_start'
  | 'speech_captured'
  | 'speech_scored'
  | 'speech_retry'
  | 'speech_pass'
  | 'speech_fail'

export interface SpeechEventPayload {
  lessonId?: string
  gameType?: string
  cardId?: string
  attempt?: number
  durationMs?: number
  score?: number
}

export function trackSpeech(event: SpeechEventName, payload: SpeechEventPayload = {}): void {
  if (__DEV__) {
    console.log(`[speech:${event}]`, payload)
  }
  // TODO: POST /api/analytics/speech when endpoint is added
}
