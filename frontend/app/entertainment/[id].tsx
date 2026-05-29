import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'
import TTSButton from '../../components/TTSButton'

const NAVY = '#093373'
const GOLD = '#F5A623'
const GREY = '#6B7280'
const GREEN = '#16A34A'
const RED = '#EF4444'
const BG = '#F3F4F6'

// ─── Speech recognition (graceful fallback if not in native build) ────────────
const _speechMod = (() => {
  try { return require('expo-speech-recognition') } catch { return null }
})()
const SpeechModule = _speechMod?.ExpoSpeechRecognitionModule ?? null
const useSpeechHook: (event: string, cb: (e: any) => void) => void =
  _speechMod?.useSpeechRecognitionEvent ?? ((_e: string, _cb: any) => {})
const IS_NATIVE = SpeechModule !== null

type Screen = 'loading' | 'error' | 'pre-quiz' | 'quiz' | 'results'

type Question = { id: string; question: string; orderIndex: number }

type ContentData = {
  id: string
  type: 'VIDEO' | 'ARTICLE'
  title: string
  description: string
  url: string
  duration: string | null
  xpReward: number
  questions: Question[]
  completed: boolean
  attempt: {
    score: number
    xpEarned: number
    answers: GradedAnswer[]
  } | null
}

type GradedAnswer = {
  questionId: string
  question: string
  spokenText: string
  correct: boolean
  expectedAnswer: string
}

type SubmitResponse = {
  score: number
  xpEarned: number
  newXpTotal?: number
  answers: GradedAnswer[]
}

type QuizAnswer = { questionId: string; spokenText: string }

function scoreEmoji(score: number): string {
  if (score === 100) return '🏆'
  if (score >= 50) return '👍'
  return '💪'
}

function scoreLabel(score: number): string {
  if (score === 100) return 'Perfect score!'
  if (score >= 50) return 'Good effort!'
  return 'Keep practicing!'
}

export default function EntertainmentQuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [screen, setScreen] = useState<Screen>('loading')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)

  // STT events
  useSpeechHook('result', (e: any) => {
    const t: string = e.results?.[0]?.transcript ?? ''
    if (t) setTranscript(t)
  })
  useSpeechHook('end', () => setListening(false))
  useSpeechHook('error', () => setListening(false))

  const { data: content, isError } = useQuery<ContentData>({
    queryKey: ['entertainment', id],
    queryFn: () => api.get(`/api/entertainment/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  useEffect(() => {
    if (isError) { setScreen('error'); return }
    if (!content) return

    if (content.completed && content.attempt) {
      setResult({
        score: content.attempt.score,
        xpEarned: content.attempt.xpEarned,
        answers: content.attempt.answers,
      })
      setScreen('results')
    } else {
      setScreen('pre-quiz')
    }
  }, [content, isError])

  useEffect(() => {
    if (listening) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      )
      pulseLoop.current.start()
    } else {
      pulseLoop.current?.stop()
      pulseAnim.setValue(1)
    }
  }, [listening])

  const submitMutation = useMutation({
    mutationFn: (ans: QuizAnswer[]) =>
      api.post(`/api/entertainment/${id}/attempt`, { answers: ans }).then((r) => r.data),
    onSuccess: (data: SubmitResponse) => {
      setResult(data)
      setScreen('results')
      queryClient.invalidateQueries({ queryKey: ['entertainment'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        // Already attempted — show results from content data
        queryClient.invalidateQueries({ queryKey: ['entertainment', id] })
      } else {
        Alert.alert('Error', 'Could not submit your answers. Please try again.')
      }
    },
  })

  const handleMicPress = useCallback(async () => {
    if (submitting) return

    if (!IS_NATIVE) {
      Alert.alert('Voice Not Available', 'Voice input requires a development build.')
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
  }, [listening, submitting])

  const handleNext = useCallback(() => {
    if (!content) return
    const currentQuestion = content.questions[currentIndex]
    const newAnswers = [...answers, { questionId: currentQuestion.id, spokenText: transcript.trim() }]
    setAnswers(newAnswers)

    if (currentIndex < content.questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setTranscript('')
    } else {
      setSubmitting(true)
      submitMutation.mutate(newAnswers)
    }
  }, [content, currentIndex, answers, transcript])

  const openContent = useCallback(() => {
    if (content?.url) Linking.openURL(content.url)
  }, [content?.url])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (screen === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>Entertainment</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Content not found</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => router.back()}>
            <Text style={styles.goldBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!content) return null

  const isVideo = content.type === 'VIDEO'
  const typeLabel = isVideo ? 'VIDEO QUIZ' : 'ARTICLE QUIZ'

  // ── Pre-quiz ───────────────────────────────────────────────────────────────
  if (screen === 'pre-quiz') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerLabel}>{typeLabel}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{content.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.preQuizBody}>
          <View style={styles.contentInfoCard}>
            <Text style={styles.contentEmoji}>{isVideo ? '🎬' : '📖'}</Text>
            <Text style={styles.contentInfoTitle}>{content.title}</Text>
            {content.duration && (
              <Text style={styles.contentInfoDesc}>{content.duration} — {content.description}</Text>
            )}
            {!content.duration && (
              <Text style={styles.contentInfoDesc}>{content.description}</Text>
            )}
            <TouchableOpacity style={styles.openLinkBtn} onPress={openContent} activeOpacity={0.8}>
              <Ionicons name="open-outline" size={16} color={NAVY} />
              <Text style={styles.openLinkBtnText}>
                {isVideo ? 'Watch the Video First' : 'Read the Article First'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.readyCard}>
            <Text style={styles.readyTitle}>Ready for the quiz?</Text>
            <Text style={styles.readyDesc}>
              You'll answer {content.questions.length} question{content.questions.length !== 1 ? 's' : ''} one at a time by{' '}
              <Text style={styles.readyDescBold}>speaking your answer</Text>. Make sure you've{' '}
              {isVideo ? 'watched the video' : 'read the article'} before starting.
            </Text>
            <TouchableOpacity
              style={styles.startQuizBtn}
              onPress={() => { setCurrentIndex(0); setAnswers([]); setTranscript(''); setScreen('quiz') }}
              activeOpacity={0.85}
            >
              <Text style={styles.startQuizBtnText}>Start Quiz →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (screen === 'quiz' && content.questions.length > 0) {
    const total = content.questions.length
    const currentQ = content.questions[currentIndex]
    const progress = (currentIndex / total) * 100
    const hasAnswer = transcript.trim().length > 0
    const isLast = currentIndex === total - 1

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('pre-quiz')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>{typeLabel}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{content.title}</Text>
          </View>
          <Text style={styles.questionCounter}>{currentIndex + 1}/{total}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
        </View>

        <View style={styles.quizBody}>
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>QUESTION {currentIndex + 1} OF {total}</Text>
            <Text style={styles.questionText}>{currentQ.question}</Text>
            <TouchableOpacity style={styles.hearBtn} activeOpacity={0.8}>
              <TTSButton text={currentQ.question} size={14} color={GREY} idleColor={GREY} />
              <Text style={styles.hearBtnText}>Hear question</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.micArea}>
            {listening && (
              <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }] }]} />
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
                <Ionicons name={listening ? 'mic-off' : 'mic'} size={36} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.micHint}>
            {listening ? 'Listening... tap to stop' : hasAnswer ? 'Tap to re-record' : 'Tap mic to speak'}
          </Text>

          {hasAnswer && (
            <View style={[styles.transcriptBox, listening && styles.transcriptBoxRecording]}>
              <Text style={styles.transcriptLabel}>YOUR ANSWER</Text>
              <View style={styles.transcriptRow}>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
                <TouchableOpacity
                  onPress={() => { setTranscript(''); setListening(false) }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="refresh-outline" size={18} color={GREY} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.goldBtn, !hasAnswer && styles.goldBtnDisabled]}
            onPress={hasAnswer && !submitting ? handleNext : undefined}
            activeOpacity={0.85}
          >
            <Text style={styles.goldBtnText}>{isLast ? 'Submit' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (screen === 'results' && result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerLabel}>{typeLabel}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{content.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.resultsBody}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreEmoji}>{scoreEmoji(result.score)}</Text>
            <Text style={styles.scorePercent}>{result.score}%</Text>
            <Text style={styles.scoreLabel}>{scoreLabel(result.score)}</Text>
            <Text style={styles.xpEarned}>
              You earned <Text style={styles.xpEarnedNum}>{result.xpEarned} XP</Text>
            </Text>
          </View>

          <Text style={styles.correctAnswersTitle}>CORRECT ANSWERS</Text>

          {result.answers.map((ans, idx) => (
            <View key={ans.questionId ?? idx} style={styles.answerCard}>
              <Text style={styles.answerQuestion}>{ans.question}</Text>
              <Text style={styles.answerCorrect}>
                Correct Answer:{' '}
                <Text style={styles.answerCorrectText}>{ans.expectedAnswer}</Text>
              </Text>
              {ans.spokenText.length > 0 && (
                <Text style={styles.answerYours}>Your answer: "{ans.spokenText}"</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.goldBtn, { marginTop: 24 }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.goldBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
    maxWidth: 220,
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY,
    marginLeft: 'auto',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: NAVY,
  },
  // Pre-quiz
  preQuizBody: {
    padding: 20,
    gap: 20,
  },
  contentInfoCard: {
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
  contentEmoji: {
    fontSize: 40,
  },
  contentInfoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  contentInfoDesc: {
    fontSize: 13,
    color: GREY,
    textAlign: 'center',
    lineHeight: 18,
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  openLinkBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },
  readyCard: {
    backgroundColor: NAVY,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  readyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readyDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },
  readyDescBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  startQuizBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  startQuizBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Quiz
  quizBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
    gap: 20,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
  },
  hearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hearBtnText: {
    fontSize: 13,
    color: GREY,
    fontWeight: '500',
  },
  micArea: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  micBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    backgroundColor: RED,
  },
  micHint: {
    fontSize: 13,
    color: GREY,
    textAlign: 'center',
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  transcriptBoxRecording: {
    borderColor: RED,
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transcriptText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
  },
  goldBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  goldBtnDisabled: {
    opacity: 0.4,
  },
  goldBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Results
  resultsBody: {
    padding: 20,
    gap: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scoreEmoji: {
    fontSize: 48,
  },
  scorePercent: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
  },
  scoreLabel: {
    fontSize: 14,
    color: GREY,
  },
  xpEarned: {
    marginTop: 4,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  xpEarnedNum: {
    color: GOLD,
    fontWeight: '800',
  },
  correctAnswersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: GREY,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  answerQuestion: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  answerCorrect: {
    fontSize: 13,
    color: '#374151',
  },
  answerCorrectText: {
    color: GREEN,
    fontWeight: '700',
  },
  answerYours: {
    fontSize: 12,
    color: GREY,
    fontStyle: 'italic',
  },
  // Error / centered
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: NAVY, textAlign: 'center' },
})
