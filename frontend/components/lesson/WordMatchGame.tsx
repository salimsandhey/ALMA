import React, { useState, useMemo, useRef } from 'react'
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import MicButton from './MicButton'
import ConfidenceBadge from './ConfidenceBadge'
import { similarity } from '../../lib/fuzzy'
import { resolveLessonImage } from '../../lib/localLessonImages'
import { SpeechState, stateLabel } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'

const NAVY = '#0B1F4B'
const TEAL = '#0D9488'
const WHITE = '#FFFFFF'

interface GameCardProps {
  card: any
  onComplete: (cardId: string, correct: boolean, xp: number) => void
  xpReward: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type PillState = 'default' | 'correct' | 'wrong'

export default function WordMatchGame({ card, onComplete, xpReward }: GameCardProps) {
  const options = useMemo(() => shuffle([card.correctWord, ...(card.distractors ?? [])]).slice(0, 4), [card.id])
  const [pillStates, setPillStates] = useState<Record<string, PillState>>({})
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

  const evaluate = (chosen: string, isCorrect: boolean) => {
    if (answered) return
    setAnswered(true)
    const states: Record<string, PillState> = {}
    options.forEach((opt) => {
      if (opt === chosen) states[opt] = isCorrect ? 'correct' : 'wrong'
      else if (opt === card.correctWord && !isCorrect) states[opt] = 'correct'
      else states[opt] = 'default'
    })
    setPillStates(states)
    if (isCorrect) {
      setSpeechState('success')
      showBanner('Correct!', true)
      onComplete(card.id, true, xpReward)
    } else {
      setSpeechState('failed')
      showBanner(`The correct word is "${card.correctWord}"`, false)
      onComplete(card.id, false, 0)
    }
  }

  const handleStateChange = (state: SpeechState) => {
    setSpeechState(state)
    if (state === 'listening') {
      micStartRef.current = Date.now()
      trackSpeech('mic_start', { cardId: card.id, gameType: 'WORD_MATCH', attempt: 1 })
    }
  }

  const handleSTTResult = (spoken: string) => {
    if (answered) return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    setLastSpoken(spoken)
    const score = similarity(spoken, card.correctWord)
    setLastScore(score)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'WORD_MATCH', attempt: 1, durationMs })
    trackSpeech('speech_scored', { cardId: card.id, gameType: 'WORD_MATCH', attempt: 1, score: Math.round(score * 100) })
    const matched = options.find((o) => similarity(spoken, o) > 0.7)
    const isCorrect = score > 0.7 || matched === card.correctWord
    trackSpeech(isCorrect ? 'speech_pass' : 'speech_fail', { cardId: card.id, gameType: 'WORD_MATCH', attempt: 1, score: Math.round(score * 100) })
    if (score > 0.7) evaluate(card.correctWord, true)
    else if (matched) evaluate(matched, matched === card.correctWord)
    else evaluate(spoken, false)
  }

  const pillStyle = (opt: string) => {
    const state = pillStates[opt] ?? 'default'
    if (state === 'correct') return { bg: '#D1FAE5', border: '#16A34A', text: '#16A34A' }
    if (state === 'wrong') return { bg: '#FEE2E2', border: '#DC2626', text: '#DC2626' }
    return { bg: WHITE, border: '#E5E7EB', text: NAVY }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {card.imageUrl ? (
          <Image source={resolveLessonImage(card.imageUrl) ?? { uri: card.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderIcon}>IMG</Text></View>
        )}
        <View style={styles.content}>
          <TouchableOpacity onPress={() => Speech.speak(card.correctWord)} activeOpacity={0.7} style={styles.speakerBtn}>
            <Ionicons name="volume-high-outline" size={22} color={TEAL} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pillsRow}>
        {options.map((opt) => {
          const ps = pillStyle(opt)
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => evaluate(opt, opt === card.correctWord)}
              disabled={answered}
              style={[styles.pill, { backgroundColor: ps.bg, borderColor: ps.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, { color: ps.text }]}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.micBlock}>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        {!!interimText && <Text style={styles.previewText}>Hearing: {interimText}</Text>}
        {!!lastSpoken && <Text style={styles.previewText}>You said: {lastSpoken}</Text>}
        <MicButton
          onResult={handleSTTResult}
          onInterim={setInterimText}
          onStateChange={handleStateChange}
          disabled={answered}
          tone="yellow"
          label="Or say the word"
        />
        {answered && lastScore !== null && !!lastSpoken && (
          <View style={styles.evalRow}>
            <ConfidenceBadge score={lastScore} />
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { width: '100%', height: 180, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 24, color: '#6B7280' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
  speakerBtn: { padding: 4 },
  pillsRow: { flexDirection: 'column', gap: 10, marginTop: 16 },
  pill: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, width: '100%', alignItems: 'center' },
  pillText: { fontSize: 15, fontWeight: '600' },
  micBlock: { marginTop: 14, alignItems: 'center' },
  evalRow: { marginTop: 8 },
  stateText: { marginBottom: 4, color: '#4B5563', fontSize: 13, fontWeight: '600' },
  previewText: { color: '#374151', fontSize: 13, marginBottom: 4 },
  banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 16, alignItems: 'center' },
  bannerCorrect: { backgroundColor: '#D1FAE5' },
  bannerWrong: { backgroundColor: '#FEE2E2' },
  bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
