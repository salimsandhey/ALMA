export type SpeechState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'failed'
  | 'no_permission'
  | 'no_speech'
  | 'noisy_env'

export function stateLabel(state: SpeechState): string {
  switch (state) {
    case 'listening':
      return 'Listening...'
    case 'processing':
      return 'Processing...'
    case 'success':
      return 'Great, captured'
    case 'failed':
      return 'Try again'
    case 'no_permission':
      return 'Mic permission needed'
    case 'no_speech':
      return 'No speech detected'
    case 'noisy_env':
      return 'Too much background noise'
    default:
      return 'Tap mic to speak'
  }
}
