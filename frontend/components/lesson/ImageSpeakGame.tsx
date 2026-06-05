import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Image, Animated, StyleSheet } from 'react-native'
import MicButton from './MicButton'
import DiffView from './DiffView'
import ConfidenceBadge from './ConfidenceBadge'
import { similarity } from '../../lib/fuzzy'
import { resolveLessonImage } from '../../lib/localLessonImages'
import { SpeechState, stateLabel } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'

export default function ImageSpeakGame({ card, onComplete, xpReward }: any) {
  const [retryCount, setRetryCount] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [bannerCorrect, setBannerCorrect] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [bestAnswer, setBestAnswer] = useState<string>('')
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const bannerOpacity = useRef(new Animated.Value(0)).current
  const micStartRef = useRef<number>(0)

  useEffect(() => {
    setRetryCount(0)
    setAnswered(false)
    setBannerText('')
    setInterimText('')
    setLastSpoken('')
    setLastScore(null)
    setBestAnswer('')
    setSpeechState('idle')
    bannerOpacity.setValue(0)
  }, [card.id])

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
      trackSpeech('mic_start', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1 })
    }
  }

  const handleSTTResult = (spoken: string) => {
    if (answered) return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    setLastSpoken(spoken)
    const acceptedAnswers: string[] = card.acceptedAnswers ?? []
    const scores = acceptedAnswers.map((ans) => similarity(spoken, ans))
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0
    const matched = acceptedAnswers[scores.indexOf(bestScore)] ?? ''
    setBestAnswer(matched)
    setLastScore(bestScore)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1, durationMs })
    trackSpeech('speech_scored', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1, score: Math.round(bestScore * 100) })
    if (bestScore > 0.7) {
      setSpeechState('success')
      setAnswered(true)
      showBanner('Correct!', true)
      trackSpeech('speech_pass', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1, score: Math.round(bestScore * 100) })
      onComplete(card.id, true, xpReward)
    } else if (retryCount === 0) {
      setSpeechState('failed')
      setRetryCount(1)
      showBanner('Try again!', false)
      trackSpeech('speech_retry', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1 })
    } else {
      setSpeechState('failed')
      setAnswered(true)
      showBanner(matched ? `The answer is: ${matched}` : 'Incorrect', false)
      trackSpeech('speech_fail', { cardId: card.id, gameType: 'IMAGE_SPEAK', attempt: retryCount + 1, score: Math.round(bestScore * 100) })
      onComplete(card.id, false, 0)
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
          <View style={styles.imagePlaceholder}><Text style={{ fontSize: 32 }}>🖼️</Text></View>
        )}
      </View>
      <View style={styles.belowCard}>
        <Text style={styles.prompt}>{card.prompt}</Text>
        <Text style={styles.stateText}>{stateLabel(speechState)}</Text>
        {!!interimText && <Text style={styles.previewText}>Hearing: {interimText}</Text>}
        {!!lastSpoken && <Text style={styles.previewText}>You said: {lastSpoken}</Text>}
        <View style={styles.micWrapper}><MicButton onResult={handleSTTResult} onInterim={setInterimText} onStateChange={handleStateChange} disabled={answered} /></View>
        {answered && !!lastSpoken && !!bestAnswer && (
          <View style={styles.evalRow}>
            <DiffView target={bestAnswer} spoken={lastSpoken} />
            {lastScore !== null && <ConfidenceBadge score={lastScore} />}
          </View>
        )}
      </View>
      {bannerText !== '' && <Animated.View style={[styles.banner, bannerCorrect ? styles.bannerCorrect : styles.bannerRetry, { opacity: bannerOpacity }]}><Text style={[styles.bannerText, { color: bannerCorrect ? '#065F46' : '#92400E' }]}>{bannerText}</Text></Animated.View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }, image: { width: '100%', height: 220 }, imagePlaceholder: { width: '100%', height: 220, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }, emojiContainer: { width: '100%', height: 220, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }, emojiText: { fontSize: 100 },
  belowCard: { alignItems: 'center', marginTop: 20 }, prompt: { color: '#6B7280', fontSize: 15, textAlign: 'center' },
  stateText: { marginTop: 8, color: '#4B5563', fontSize: 13, fontWeight: '600' }, previewText: { marginTop: 4, color: '#374151', fontSize: 13 },
  micWrapper: { marginTop: 16 }, evalRow: { alignItems: 'center', marginTop: 10, gap: 8 }, banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 20, alignItems: 'center' }, bannerCorrect: { backgroundColor: '#D1FAE5' }, bannerRetry: { backgroundColor: '#FEF9C3' }, bannerText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
