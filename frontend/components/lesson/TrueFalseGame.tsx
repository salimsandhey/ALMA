import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import MicButton from './MicButton'
import SpeechPreview from './SpeechPreview'
import { SpeechState, stateLabel } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'

interface GameCardProps {
  card: any
  onComplete: (cardId: string, correct: boolean, xp: number) => void
  xpReward: number
  currentIndex?: number
  totalCards?: number
}

type ButtonState = 'default' | 'correct' | 'wrong'

export default function TrueFalseGame({ card, onComplete, xpReward, currentIndex = 0, totalCards = 1 }: GameCardProps) {
  const [timeLeft, setTimeLeft] = useState(7)
  const [answered, setAnswered] = useState(false)
  const answeredRef = useRef(false)
  const [trueState, setTrueState] = useState<ButtonState>('default')
  const [falseState, setFalseState] = useState<ButtonState>('default')
  const [showExplanation, setShowExplanation] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [bannerCorrect, setBannerCorrect] = useState(true)
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const [lastSpoken, setLastSpoken] = useState('')
  const bannerOpacity = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const micStartRef = useRef<number>(0)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Separate effect: trigger handleAnswer when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0) handleAnswer(null)
  }, [timeLeft])

  const showBanner = (text: string, correct: boolean) => {
    setBannerText(text)
    setBannerCorrect(correct)
    bannerOpacity.setValue(0)
    Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const handleAnswer = (chosen: boolean | null) => {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    if (timerRef.current) clearInterval(timerRef.current)
    const isCorrect = chosen !== null && chosen === card.isTrue
    if (card.isTrue) { setTrueState('correct'); if (chosen === false) setFalseState('wrong') }
    else { setFalseState('correct'); if (chosen === true) setTrueState('wrong') }
    setShowExplanation(true)
    if (isCorrect) {
      setSpeechState('success')
      showBanner('Correct!', true)
      trackSpeech('speech_pass', { cardId: card.id, gameType: 'TRUE_FALSE', attempt: 1 })
      setTimeout(() => onComplete(card.id, true, xpReward), 1500)
    } else {
      setSpeechState('failed')
      showBanner('Incorrect!', false)
      trackSpeech('speech_fail', { cardId: card.id, gameType: 'TRUE_FALSE', attempt: 1 })
      setTimeout(() => onComplete(card.id, false, 0), 1500)
    }
  }

  const handleStateChange = (state: SpeechState) => {
    setSpeechState(state)
    if (state === 'listening') {
      micStartRef.current = Date.now()
      trackSpeech('mic_start', { cardId: card.id, gameType: 'TRUE_FALSE', attempt: 1 })
    }
  }

  const handleSTT = (transcripts: string[]) => {
    if (answered) return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    const combined = transcripts.join(' ')
    setLastSpoken(combined)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'TRUE_FALSE', attempt: 1, durationMs })
    const lower = combined.toLowerCase()
    if (lower.includes('true')) handleAnswer(true)
    else if (lower.includes('false')) handleAnswer(false)
  }

  const trueColors = () => trueState === 'correct' ? { bg: '#16A34A', border: '#16A34A', text: '#FFFFFF' } : trueState === 'wrong' ? { bg: '#FEE2E2', border: '#DC2626', text: '#DC2626' } : { bg: '#FFFFFF', border: '#16A34A', text: '#16A34A' }
  const falseColors = () => falseState === 'correct' ? { bg: '#DC2626', border: '#DC2626', text: '#FFFFFF' } : falseState === 'wrong' ? { bg: '#FEE2E2', border: '#DC2626', text: '#DC2626' } : { bg: '#FFFFFF', border: '#DC2626', text: '#DC2626' }
  const tc = trueColors()
  const fc = falseColors()

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.stepText}>{currentIndex + 1}/{totalCards}</Text><Text style={styles.stepText}>{timeLeft}s</Text></View>
      <View style={styles.card}><Text style={styles.label}>True or False?</Text><Text style={styles.statement}>{card.statement}</Text></View>
      <View style={styles.micWrapper}>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        <SpeechPreview interimText="" lastSpoken={answered ? '' : lastSpoken} />
        <MicButton onResult={handleSTT} onStateChange={handleStateChange} disabled={answered} tone="yellow" label="Tap mic to answer" />
      </View>
      <View style={styles.buttonsRow}>
        <View style={[styles.answerButton, { backgroundColor: tc.bg, borderColor: tc.border }]}><Text style={[styles.answerButtonText, { color: tc.text }]}>True</Text></View>
        <View style={[styles.answerButton, { backgroundColor: fc.bg, borderColor: fc.border }]}><Text style={[styles.answerButtonText, { color: fc.text }]}>False</Text></View>
      </View>
      {showExplanation && card.explanation ? <Text style={styles.explanation}>{card.explanation}</Text> : null}
      {bannerText !== '' && <Animated.View style={[styles.banner, bannerCorrect ? styles.bannerCorrect : styles.bannerWrong, { opacity: bannerOpacity }]}><Text style={[styles.bannerText, { color: bannerCorrect ? '#065F46' : '#991B1B' }]}>{bannerText}</Text></Animated.View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
  stepText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  statement: { color: '#093373', fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  micWrapper: { marginTop: 10, alignItems: 'center' },
  stateText: { color: '#4B5563', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  previewText: { color: '#374151', fontSize: 13, marginBottom: 4 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  answerButton: { flex: 1, borderRadius: 12, paddingVertical: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  answerButtonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  explanation: { color: '#6B7280', fontSize: 13, lineHeight: 20, marginTop: 16, textAlign: 'center' },
  banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 16, alignItems: 'center' },
  bannerCorrect: { backgroundColor: '#D1FAE5' },
  bannerWrong: { backgroundColor: '#FEE2E2' },
  bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
