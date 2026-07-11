import React, { useState, useMemo, useRef, useEffect } from 'react'
import { View, Text, Image, Animated, StyleSheet } from 'react-native'
import MicButton from './MicButton'
import SpeechPreview from './SpeechPreview'
import { resolveLessonImage } from '../../lib/localLessonImages'
import { similarity } from '../../lib/fuzzy'
import { SpeechState, stateLabel } from '../../lib/speech'

const NAVY = '#093373'
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
  const options = useMemo(() => shuffle([...new Set([card.correctWord, ...(card.distractors ?? [])])]).slice(0, 4), [card.id])
  const [pillStates, setPillStates] = useState<Record<string, PillState>>({})
  const [answered, setAnswered] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [bannerText, setBannerText] = useState('')
  const [bannerCorrect, setBannerCorrect] = useState(true)
  const [bannerRetry, setBannerRetry] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const bannerOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setAnswered(false)
    setRetryCount(0)
    setPillStates({})
    setBannerText('')
    setInterimText('')
    setSpeechState('idle')
    bannerOpacity.setValue(0)
  }, [card.id])

  const showBanner = (text: string, correct: boolean, retry = false) => {
    setBannerText(text)
    setBannerCorrect(correct)
    setBannerRetry(retry)
    bannerOpacity.setValue(0)
    Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const handleSTTResult = (transcripts: string[]) => {
    if (answered) return

    // Find the (transcript, option) pair with the highest similarity score
    let bestScore = 0
    let chosen = options[0]
    for (const t of transcripts) {
      const scores = options.map((opt) => similarity(t, opt))
      const topScore = Math.max(...scores)
      if (topScore > bestScore) {
        bestScore = topScore
        chosen = options[scores.indexOf(topScore)]
      }
    }
    const isCorrect = chosen === card.correctWord && bestScore > 0.6

    if (isCorrect) {
      const states: Record<string, PillState> = {}
      options.forEach((opt) => { states[opt] = opt === card.correctWord ? 'correct' : 'default' })
      setPillStates(states)
      setAnswered(true)
      showBanner('Correct!', true)
      onComplete(card.id, true, xpReward)
    } else if (retryCount === 0) {
      setRetryCount(1)
      setSpeechState('failed')
      showBanner('Try again!', false, true)
    } else {
      const states: Record<string, PillState> = {}
      options.forEach((opt) => {
        if (opt === chosen && chosen !== card.correctWord) states[opt] = 'wrong'
        else if (opt === card.correctWord) states[opt] = 'correct'
        else states[opt] = 'default'
      })
      setPillStates(states)
      setAnswered(true)
      showBanner(`The correct word is "${card.correctWord}"`, false)
      onComplete(card.id, false, 0)
    }
  }

  const pillStyle = (opt: string) => {
    const state = pillStates[opt] ?? 'default'
    if (state === 'correct') return { bg: '#D1FAE5', border: '#16A34A', text: '#16A34A' }
    if (state === 'wrong') return { bg: '#FEE2E2', border: '#DC2626', text: '#DC2626' }
    return { bg: WHITE, border: '#E5E7EB', text: NAVY }
  }

  const visual = card.imageUrl ?? card.emoji ?? ''
  const localImage = resolveLessonImage(visual)
  const isRemoteUrl = !!visual && (visual.startsWith('http://') || visual.startsWith('https://'))
  const isEmoji = !!visual && !visual.startsWith('local:') && !isRemoteUrl && visual.trim().length > 0

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {localImage ? (
          <Image source={localImage} style={styles.image} resizeMode="cover" />
        ) : isRemoteUrl ? (
          <Image source={{ uri: visual }} style={styles.image} resizeMode="cover" />
        ) : isEmoji ? (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.emojiIcon}>{visual}</Text>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderIcon}>IMG</Text></View>
        )}
        <View style={styles.content} />
      </View>

      <View style={styles.pillsRow}>
        {options.map((opt) => {
          const ps = pillStyle(opt)
          return (
            <View
              key={opt}
              style={[styles.pill, { backgroundColor: ps.bg, borderColor: ps.border }]}
            >
              <Text style={[styles.pillText, { color: ps.text }]}>{opt}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.micBlock}>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        <SpeechPreview interimText={interimText} lastSpoken="" />
        <View style={styles.micWrapper}>
          <MicButton
            onResult={handleSTTResult}
            onInterim={setInterimText}
            onStateChange={setSpeechState}
            disabled={answered}
            tone="yellow"
          />
        </View>
      </View>

      {bannerText !== '' && (
        <Animated.View style={[
          styles.banner,
          bannerCorrect ? styles.bannerCorrect : bannerRetry ? styles.bannerRetry : styles.bannerWrong,
          { opacity: bannerOpacity },
        ]}>
          <Text style={[styles.bannerText, { color: bannerCorrect ? '#065F46' : bannerRetry ? '#92400E' : '#991B1B' }]}>
            {bannerText}
          </Text>
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
  emojiIcon: { fontSize: 80 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
  pillsRow: { flexDirection: 'column', gap: 10 },
  pill: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, width: '100%', alignItems: 'center' },
  pillText: { fontSize: 15, fontWeight: '600' },
  micBlock: { marginTop: 24, alignItems: 'center' },
  stateText: { color: '#4B5563', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  previewText: { color: '#374151', fontSize: 13, marginBottom: 4 },
  micWrapper: { marginTop: 12 },
  banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 16, alignItems: 'center' },
  bannerCorrect: { backgroundColor: '#D1FAE5' },
  bannerRetry: { backgroundColor: '#FEF9C3' },
  bannerWrong: { backgroundColor: '#FEE2E2' },
  bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
