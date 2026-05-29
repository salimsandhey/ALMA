import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import TTSButton from '../components/TTSButton'

const NAVY = '#093373'
const GOLD = '#F5A623'
const GREY = '#6B7280'
const BG = '#F3F4F6'

const _speechMod = (() => {
  try { return require('expo-speech-recognition') } catch { return null }
})()
const SpeechModule = _speechMod?.ExpoSpeechRecognitionModule ?? null
const useSpeechHook: (event: string, cb: (e: any) => void) => void =
  _speechMod?.useSpeechRecognitionEvent ?? ((_e: string, _cb: any) => {})
const IS_NATIVE = SpeechModule !== null

type Screen = 'loading' | 'intro' | 'voice' | 'result'

type ChallengeData = {
  id: string
  question: string
  xpReward: number
  alreadyAttempted: boolean
  attemptResult: {
    correct: boolean
    spokenText: string
    xpEarned: number
    sampleAnswer: string
  } | null
}

type ResultData = {
  correct: boolean
  spokenText: string
  sampleAnswer: string
  xpEarned: number
}

export default function DailyChallenge() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('loading')
  const [challenge, setChallenge] = useState<ChallengeData | null>(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ResultData | null>(null)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(0.7)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)

  // STT events
  useSpeechHook('result', (e: any) => {
    const t: string = e.results?.[0]?.transcript ?? ''
    if (!t) return
    setTranscript(t)
    if (e.isFinal) {
      setListening(false)
      handleSubmit(t)
    }
  })
  useSpeechHook('end', () => setListening(false))
  useSpeechHook('error', () => setListening(false))

  useEffect(() => {
    loadChallenge()
  }, [])

  useEffect(() => {
    if (listening) {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0.15, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
          ]),
        ])
      )
      pulseLoop.current.start()
    } else {
      pulseLoop.current?.stop()
      pulseAnim.setValue(1)
      pulseOpacity.setValue(0.7)
    }
  }, [listening])

  const loadChallenge = async () => {
    try {
      const { data } = await api.get('/api/challenges/daily')
      setChallenge(data)

      if (data.alreadyAttempted && data.attemptResult) {
        setResult(data.attemptResult)
        setScreen('result')
      } else {
        setScreen('intro')
      }
    } catch (err: any) {
      console.error('[daily-challenge] load error:', err?.response?.data ?? err?.message)
      setScreen('error' as any)
    }
  }

  const handleStartChallenge = () => {
    setScreen('voice')
    setTranscript('')
  }

  const handleMicPress = async () => {
    if (submitting) return

    if (!IS_NATIVE) {
      Alert.alert(
        'Voice Not Available',
        'Voice input is not available in Expo Go. Please use a development build.',
        [{ text: 'OK' }]
      )
      return
    }

    if (listening) {
      SpeechModule.stop()
      setListening(false)
      return
    }

    try {
      const perm = await SpeechModule.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.')
        return
      }
    } catch { return }

    setTranscript('')
    setListening(true)
    try {
      await SpeechModule.start({ lang: 'en-US', interimResults: true, maxAlternatives: 1 })
    } catch {
      setListening(false)
    }
  }

  const handleSubmit = async (spokenText: string) => {
    if (!spokenText.trim() || submitting) return
    setSubmitting(true)

    try {
      const { data } = await api.post('/api/challenges/daily/submit', { spokenText })
      setResult(data)
      setScreen('result')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Already attempted — reload to get result
        loadChallenge()
      } else {
        Alert.alert('Error', 'Could not submit your answer. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if ((screen as string) === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ Daily Challenge</Text>
        </View>
        <View style={[styles.body, { justifyContent: 'center' }]}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
          <Text style={{ color: NAVY, fontSize: 17, fontWeight: '700', marginBottom: 8 }}>Could not load today's challenge</Text>
          <Text style={{ color: GREY, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            Make sure the backend server is running and try again.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => { setScreen('loading'); loadChallenge() }}>
            <Text style={styles.startBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Intro ─────────────────────────────────────────────────────────────────
  if (screen === 'intro' && challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ Daily Challenge</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>⚡ +{challenge.xpReward} ALMA Points for the right answer!</Text>
          </View>

          <Text style={styles.bigEmoji}>🎯</Text>

          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>TODAY'S QUESTION</Text>
            <Text style={styles.questionText}>{challenge.question}</Text>
          </View>

          <Text style={styles.hintText}>Tap the button and answer in English using your voice!</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartChallenge} activeOpacity={0.85}>
            <Ionicons name="mic" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnText}>Start Challenge</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Voice ─────────────────────────────────────────────────────────────────
  if (screen === 'voice' && challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('intro')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ Daily Challenge</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.voiceQuestionCard}>
            <TTSButton text={challenge.question} size={20} color={NAVY} idleColor={NAVY} style={{ marginRight: 8 }} />
            <Text style={styles.voiceQuestionText}>{challenge.question}</Text>
          </View>

          <View style={styles.micArea}>
            {listening && (
              <Animated.View
                style={[
                  styles.micPulse,
                  { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]}
              />
            )}
            <TouchableOpacity
              style={[styles.micBtn, listening && styles.micBtnListening]}
              onPress={handleMicPress}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <Ionicons name={listening ? 'stop' : 'mic'} size={36} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {listening && (
            <Text style={styles.listeningText}>🎙️ Listening... speak now!</Text>
          )}

          {transcript.length > 0 && (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            </View>
          )}

          <Text style={styles.hintText}>Tap mic to start, tap again to stop</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Result ────────────────────────────────────────────────────────────────
  if (screen === 'result' && result) {
    const correct = result.correct

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ Daily Challenge</Text>
        </View>

        <View style={styles.body}>
          {correct && (
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>⚡ +{result.xpEarned} ALMA Points!</Text>
            </View>
          )}

          <Text style={styles.bigEmoji}>{correct ? '👏' : '💪'}</Text>

          <View style={[styles.resultCard, correct ? styles.resultCardCorrect : styles.resultCardWrong]}>
            <Text style={[styles.resultTitle, correct ? styles.resultTitleCorrect : styles.resultTitleWrong]}>
              {correct ? 'Your Answer is Correct!' : 'Uh oh! Keep practicing!'}
            </Text>
            <Text style={[styles.resultSubtitle, correct ? styles.resultSubtitleCorrect : styles.resultSubtitleWrong]}>
              You said: <Text style={{ fontStyle: 'italic' }}>"{result.spokenText}"</Text>
            </Text>
          </View>

          <View style={styles.correctAnswerCard}>
            <Text style={styles.correctAnswerLabel}>THE CORRECT ANSWER:</Text>
            <View style={styles.correctAnswerRow}>
              <TTSButton text={result.sampleAnswer} size={16} color={NAVY} idleColor={NAVY} style={{ marginRight: 6 }} />
              <Text style={styles.correctAnswerText}>"{result.sampleAnswer}"</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.replace('/(student)/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return null
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  xpBadgeText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700',
  },
  bigEmoji: {
    fontSize: 72,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionLabel: {
    color: GREY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  questionText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  hintText: {
    color: GREY,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  startBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  // ── Voice screen ──────────────────────────────────────────────────────────
  voiceQuestionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  voiceQuestionText: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  micArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  micPulse: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  micBtnListening: {
    backgroundColor: '#EF4444',
  },
  listeningText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptText: {
    color: '#374151',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // ── Result screen ─────────────────────────────────────────────────────────
  resultCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  resultCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  resultCardWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultTitleCorrect: {
    color: '#15803D',
  },
  resultTitleWrong: {
    color: '#DC2626',
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultSubtitleCorrect: {
    color: '#166534',
  },
  resultSubtitleWrong: {
    color: '#991B1B',
  },
  correctAnswerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  correctAnswerLabel: {
    color: GREY,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctAnswerText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
})
