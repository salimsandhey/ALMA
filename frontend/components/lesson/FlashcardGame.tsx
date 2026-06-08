import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import TTSButton from '../TTSButton'
import MicButton from './MicButton'
import DiffView from './DiffView'
import ConfidenceBadge from './ConfidenceBadge'
import { similarity } from '../../lib/fuzzy'
import { resolveLessonImage } from '../../lib/localLessonImages'
import { SpeechState, stateLabel } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'

const NAVY = '#093373'
const TEAL = '#0D9488'
const GREY = '#6B7280'
const WHITE = '#FFFFFF'

interface GameCardProps {
  card: any
  onComplete: (cardId: string, correct: boolean, xp: number) => void
  xpReward: number
}

export default function FlashcardGame({ card, onComplete, xpReward }: GameCardProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [bannerText, setBannerText] = useState('')
  const [bannerCorrect, setBannerCorrect] = useState(true)
  const [answered, setAnswered] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const bannerOpacity = useRef(new Animated.Value(0)).current
  const micStartRef = useRef<number>(0)

  useEffect(() => {
    setRetryCount(0)
    setBannerText('')
    setAnswered(false)
    setInterimText('')
    setLastSpoken('')
    setLastScore(null)
    setSpeechState('idle')
    bannerOpacity.setValue(0)
  }, [card.id])

  const showBanner = (text: string, correct: boolean) => {
    setBannerText(text)
    setBannerCorrect(correct)
    bannerOpacity.setValue(0)
    Animated.timing(bannerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const handleStateChange = (state: SpeechState) => {
    setSpeechState(state)
    if (state === 'listening') {
      micStartRef.current = Date.now()
      trackSpeech('mic_start', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1 })
    }
  }

  const handleSTTResult = (spoken: string) => {
    if (answered) return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    setLastSpoken(spoken)
    const score = similarity(spoken, card.targetWord ?? card.word)
    setLastScore(score)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1, durationMs })
    trackSpeech('speech_scored', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1, score: Math.round(score * 100) })
    if (score > 0.7) {
      setSpeechState('success')
      setAnswered(true)
      trackSpeech('speech_pass', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1, score: Math.round(score * 100) })
      onComplete(card.id, true, xpReward)
    } else if (retryCount === 0) {
      setSpeechState('failed')
      showBanner('Try again. One more chance.', false)
      trackSpeech('speech_retry', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1 })
      setRetryCount(1)
    } else {
      setSpeechState('failed')
      showBanner(`The word is "${card.targetWord ?? card.word}"`, false)
      setAnswered(true)
      trackSpeech('speech_fail', { cardId: card.id, gameType: 'FLASHCARD', attempt: retryCount + 1, score: Math.round(score * 100) })
      onComplete(card.id, false, xpReward)
    }
  }

  const localImage = resolveLessonImage(card.imageUrl)
  const isRemoteUrl = card.imageUrl && (card.imageUrl.startsWith('http://') || card.imageUrl.startsWith('https://'))
  const isEmoji = card.imageUrl && !card.imageUrl.startsWith('local:') && !isRemoteUrl && card.imageUrl.trim().length > 0

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {localImage ? (
          <Image source={localImage} style={styles.image} resizeMode="cover" />
        ) : isRemoteUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : isEmoji ? (
          <View style={styles.emojiContainer}>
            <Text style={styles.emojiText}>{card.imageUrl}</Text>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.wordRow}>
            <Text style={styles.word}>{card.word}</Text>
            <TTSButton text={card.word} size={22} color={TEAL} idleColor={TEAL} />
          </View>
        </View>
      </View>

      <View style={styles.micArea}>
        <Text style={styles.instruction}>
          Now <Text style={styles.instructionStrong}>say the word</Text> out loud
        </Text>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        {!!interimText && <Text style={styles.previewText}>Hearing: {interimText}</Text>}
        {!!lastSpoken && <Text style={styles.previewText}>You said: {lastSpoken}</Text>}

        <View style={styles.micWrapper}>
          <MicButton
            onResult={handleSTTResult}
            onInterim={setInterimText}
            onStateChange={handleStateChange}
            disabled={answered}
            tone="yellow"
            label="Tap mic to pronounce"
          />
        </View>
        {answered && !!lastSpoken && (
          <View style={styles.evalRow}>
            <DiffView target={card.targetWord ?? card.word} spoken={lastSpoken} />
            {lastScore !== null && <ConfidenceBadge score={lastScore} />}
          </View>
        )}
      </View>

      {bannerText !== '' && (
        <Animated.View
          style={[
            styles.banner,
            bannerCorrect ? styles.bannerCorrect : styles.bannerRetry,
            { opacity: bannerOpacity },
          ]}
        >
          <Text style={[styles.bannerText, { color: bannerCorrect ? '#065F46' : '#92400E' }]}>
            {bannerText}
          </Text>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 16,
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: { fontSize: 32, color: '#9CA3AF' },
  emojiContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 96 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    alignItems: 'center',
  },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { color: NAVY, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  speakerBtn: { padding: 4 },
  micArea: { alignItems: 'center', marginTop: 14 },
  instruction: { color: GREY, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  instructionStrong: { color: NAVY, fontWeight: '800' },
  stateText: { marginTop: 8, color: '#4B5563', fontSize: 13, fontWeight: '600' },
  previewText: { marginTop: 6, color: '#374151', fontSize: 13 },
  micWrapper: { marginTop: 16 },
  evalRow: { alignItems: 'center', marginTop: 12, gap: 8 },
  banner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  bannerCorrect: { backgroundColor: '#D1FAE5' },
  bannerRetry: { backgroundColor: '#FEF9C3' },
  bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
