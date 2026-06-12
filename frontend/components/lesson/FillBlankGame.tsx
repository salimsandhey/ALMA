import React, { useState, useRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import MicButton from './MicButton'
import DiffView from './DiffView'
import ConfidenceBadge from './ConfidenceBadge'
import { similarity } from '../../lib/fuzzy'
import { SpeechState, stateLabel } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'
import { NAVY, TEAL, GREY, WHITE, GOLD } from '../../constants/colors'

interface GameCardProps {
  card: any
  onComplete: (cardId: string, correct: boolean, xp: number) => void
  xpReward: number
}

export default function FillBlankGame({ card, onComplete, xpReward }: GameCardProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [filledWord, setFilledWord] = useState<string | null>(null)
  const [fillCorrect, setFillCorrect] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [bannerCorrect, setBannerCorrect] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const bannerOpacity = useRef(new Animated.Value(0)).current
  const micStartRef = useRef<number>(0)

  const showBanner = (text: string, correct: boolean) => {
    setBannerText(text)
    setBannerCorrect(correct)
    bannerOpacity.setValue(0)
    Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const handleStateChange = (state: SpeechState) => {
    setSpeechState(state)
    if (state === 'listening') {
      micStartRef.current = Date.now()
      trackSpeech('mic_start', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1 })
    }
  }

  const handleSTTResult = (spoken: string) => {
    if (answered) return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    setLastSpoken(spoken)
    const score = similarity(spoken, card.correctAnswer)
    setLastScore(score)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1, durationMs })
    trackSpeech('speech_scored', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1, score: Math.round(score * 100) })
    if (score > 0.7) {
      setSpeechState('success')
      setFilledWord(spoken)
      setFillCorrect(true)
      setAnswered(true)
      showBanner('Correct!', true)
      trackSpeech('speech_pass', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1, score: Math.round(score * 100) })
      onComplete(card.id, true, xpReward)
    } else if (retryCount === 0) {
      setSpeechState('failed')
      showBanner('Not quite. Try once more.', false)
      trackSpeech('speech_retry', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1 })
      setRetryCount(1)
    } else {
      setSpeechState('failed')
      setFilledWord(card.correctAnswer)
      setFillCorrect(false)
      setAnswered(true)
      showBanner(`The answer was "${card.correctAnswer}"`, false)
      trackSpeech('speech_fail', { cardId: card.id, gameType: 'FILL_BLANK', attempt: retryCount + 1, score: Math.round(score * 100) })
      onComplete(card.id, false, 0)
    }
  }

  const options = useMemo(() => {
    const distractors: string[] = card.distractors ?? []
    const all = [card.correctAnswer, ...distractors.slice(0, 3)]
    return all.sort(() => Math.random() - 0.5)
  }, [card.id])

  const parts = (card.sentenceTemplate as string).split(/_{1,}/)
  const before = parts[0] ?? ''
  const after = parts[1] ?? ''

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.sentenceRow}>
          <Text style={styles.sentenceText}>{before}</Text>
          {filledWord ? (
            <Text style={[styles.filledWord, { color: fillCorrect ? TEAL : '#DC2626' }]}>{filledWord}</Text>
          ) : (
            <View style={styles.blank} />
          )}
          {after !== '' && <Text style={styles.sentenceText}>{after}</Text>}
        </View>
        {card.hint ? <Text style={styles.hint}>(Hint: {card.hint})</Text> : null}
      </View>

      <View style={styles.pillsRow}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} onPress={() => !answered && handleSTTResult(opt)} disabled={answered} style={[styles.pill, answered && opt === card.correctAnswer && styles.pillCorrect]}>
            <Text style={[styles.pillText, answered && opt === card.correctAnswer && styles.pillTextCorrect]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.micArea}>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        {!!interimText && <Text style={styles.previewText}>Hearing: {interimText}</Text>}
        {!!lastSpoken && <Text style={styles.previewText}>You said: {lastSpoken}</Text>}
        <MicButton onResult={handleSTTResult} onInterim={setInterimText} onStateChange={handleStateChange} disabled={answered} tone="yellow" label="Say the missing word" />
        {answered && !!lastSpoken && (
          <View style={styles.evalRow}>
            <DiffView target={card.correctAnswer} spoken={lastSpoken} />
            {lastScore !== null && <ConfidenceBadge score={lastScore} />}
          </View>
        )}
      </View>

      {bannerText !== '' && (
        <Animated.View style={[styles.banner, bannerCorrect ? styles.bannerCorrect : styles.bannerWrong, { opacity: bannerOpacity }]}>
          <Text style={[styles.bannerText, { color: bannerCorrect ? '#065F46' : '#991B1B' }]}>{bannerText}</Text>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 22 },
  sentenceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 16 },
  sentenceText: { color: NAVY, fontSize: 21, fontWeight: '800', lineHeight: 28 },
  blank: { borderBottomWidth: 2.5, borderBottomColor: GOLD, minWidth: 80, height: 28, marginHorizontal: 6 },
  filledWord: { fontSize: 18, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: TEAL, minWidth: 60, textAlign: 'center', lineHeight: 28 },
  hint: { color: GREY, fontSize: 12, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
  pillsRow: { flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', gap: 8, marginVertical: 16 },
  pill: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff', minWidth: 74, alignItems: 'center' },
  pillCorrect: { borderColor: '#0D9488', backgroundColor: '#CCFBF1' },
  pillText: { color: '#093373', fontSize: 15, fontWeight: '600' },
  pillTextCorrect: { color: '#0D9488' },
  micArea: { marginTop: 12, alignItems: 'center' },
  evalRow: { alignItems: 'center', marginTop: 10, gap: 8 },
  stateText: { color: '#4B5563', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  previewText: { color: '#374151', fontSize: 13, marginBottom: 4 },
  banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 20, alignItems: 'center' },
  bannerCorrect: { backgroundColor: '#D1FAE5' },
  bannerWrong: { backgroundColor: '#FEE2E2' },
  bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
