import React, { useState, useRef, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { useVoiceStore, getSpeakOptions } from '../../stores/voiceStore'
import TTSButton from '../TTSButton'
import MicButton from './MicButton'
import DiffView from './DiffView'
import ConfidenceBadge from './ConfidenceBadge'
import { similarity } from '../../lib/fuzzy'
import { SpeechState } from '../../lib/speech'
import { trackSpeech } from '../../lib/speechAnalytics'

interface Turn { speaker: 'GUEST' | 'USER'; text: string | null; expectedResponse: string | null }
interface Segment { guestLines: string[]; expected: string }
type Phase = 'user-input' | 'continuing' | 'done'
type HistoryItem = { type: 'guest'; text: string } | { type: 'user'; text: string }

function buildSegments(turns: Turn[]): Segment[] {
  const segments: Segment[] = []
  let guestAccum: string[] = []
  for (const t of turns) {
    if (t.speaker === 'GUEST') guestAccum.push(t.text ?? '')
    else {
      segments.push({ guestLines: [...guestAccum], expected: t.expectedResponse ?? '' })
      guestAccum = []
    }
  }
  return segments
}

export default function DialogueGame({ card, onComplete, xpReward }: any) {
  const segments = useMemo(() => buildSegments(card.turns ?? []), [card.id])
  const [segIdx, setSegIdx] = useState(0)
  const [interimText, setInterimText] = useState('')
  const [lastSpoken, setLastSpoken] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    segments[0]?.guestLines.map(t => ({ type: 'guest' as const, text: t })) ?? []
  )
  const [phase, setPhase] = useState<Phase>('user-input')
  const [retryCount, setRetryCount] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const micStartRef = useRef<number>(0)

  const voiceOpts = () => getSpeakOptions(useVoiceStore.getState().voiceGender)

  useEffect(() => {
    if (segments[0]?.guestLines[0]) setTimeout(() => Speech.speak(segments[0].guestLines[0], voiceOpts()), 300)
  }, [])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
  }, [history, phase])

  const currentSeg = segments[segIdx]

  const advanceToNext = (nextIdx: number) => {
    if (nextIdx >= segments.length) {
      setPhase('done')
      onComplete(card.id, true, xpReward)
      return
    }
    const nextSeg = segments[nextIdx]
    setHistory(prev => [...prev, ...nextSeg.guestLines.map(t => ({ type: 'guest' as const, text: t }))])
    if (nextSeg.guestLines[0]) setTimeout(() => Speech.speak(nextSeg.guestLines[0], voiceOpts()), 300)
    setSegIdx(nextIdx)
    setRetryCount(0)
    setSpeechState('idle')
    setInterimText('')
    setLastSpoken('')
    setLastScore(null)
    setPhase('user-input')
  }

  const handleStateChange = (state: SpeechState) => {
    setSpeechState(state)
    if (state === 'listening') {
      micStartRef.current = Date.now()
      trackSpeech('mic_start', { cardId: card.id, gameType: 'DIALOGUE', attempt: retryCount + 1 })
    }
  }

  const handleSTTResult = (spoken: string) => {
    if (!currentSeg || phase !== 'user-input') return
    const durationMs = micStartRef.current ? Date.now() - micStartRef.current : undefined
    setLastSpoken(spoken)
    const score = similarity(spoken, currentSeg.expected)
    setLastScore(score)
    trackSpeech('speech_captured', { cardId: card.id, gameType: 'DIALOGUE', attempt: retryCount + 1, durationMs })
    trackSpeech('speech_scored', { cardId: card.id, gameType: 'DIALOGUE', attempt: retryCount + 1, score: Math.round(score * 100) })
    const accepted = score > 0.6 || retryCount >= 2

    if (accepted) {
      const displayText = score > 0.6 ? spoken : currentSeg.expected
      setSpeechState('success')
      trackSpeech('speech_pass', { cardId: card.id, gameType: 'DIALOGUE', attempt: retryCount + 1, score: Math.round(score * 100) })
      setHistory(prev => [...prev, { type: 'user', text: displayText }])
      setPhase('continuing')
      setTimeout(() => advanceToNext(segIdx + 1), 1200)
    } else {
      setSpeechState('failed')
      trackSpeech(retryCount >= 1 ? 'speech_fail' : 'speech_retry', { cardId: card.id, gameType: 'DIALOGUE', attempt: retryCount + 1, score: Math.round(score * 100) })
      setRetryCount(r => r + 1)
    }
  }

  const hearExample = () => {
    if (currentSeg?.expected) Speech.speak(currentSeg.expected, voiceOpts())
  }

  return (
    <View style={styles.container}>
      {card.scenario ? (
        <View style={styles.scenarioBanner}>
          <Text style={styles.scenarioPin}>📍</Text>
          <Text style={styles.scenarioText}>{card.scenario}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {history.map((item, idx) =>
          item.type === 'guest' ? (
            <View key={idx} style={styles.guestBlock}>
              <Text style={styles.guestLabel}>Other</Text>
              <View style={styles.guestBubble}>
                <Text style={styles.guestBubbleText}>{item.text}</Text>
              </View>
              <TTSButton text={item.text} size={16} color="#9CA3AF" idleColor="#9CA3AF" style={styles.speakerBtn} />
            </View>
          ) : (
            <View key={idx} style={styles.userBlock}>
              <Text style={styles.userLabel}>You 🧑</Text>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>{item.text}</Text>
              </View>
            </View>
          )
        )}

        {phase === 'continuing' && (
          <View style={styles.typingRow}>
            <Text style={styles.typingDots}>···</Text>
          </View>
        )}
      </ScrollView>

      {phase === 'user-input' && currentSeg ? (
        <View style={styles.inputPanel}>
          <Text style={styles.yourTurnLabel}>🎙️ Your turn — say this line:</Text>

          <View style={styles.expectedCard}>
            <Text style={styles.expectedText}>{currentSeg.expected}</Text>
            <View style={styles.hearBtn}>
              <TTSButton text={currentSeg.expected} size={14} color="#143F86" idleColor="#143F86" />
              <Text style={styles.hearBtnText}> Hear example</Text>
            </View>
          </View>

          <MicButton
            onResult={handleSTTResult}
            onInterim={setInterimText}
            onStateChange={handleStateChange}
            tone="yellow"
            label="Tap to speak your line"
          />

          {interimText !== '' ? (
            <Text style={styles.hearingText}>Hearing: {interimText}</Text>
          ) : null}

          {speechState === 'failed' && !!lastSpoken && currentSeg ? (
            <View style={styles.diffBlock}>
              <DiffView target={currentSeg.expected} spoken={lastSpoken} />
              {lastScore !== null && <ConfidenceBadge score={lastScore} />}
              <Text style={styles.retryText}>Try again — speak more clearly</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.helpBtnText}> Help</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

const NAVY = '#093373'
const BG = '#F2F3F7'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Scenario banner
  scenarioBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  scenarioPin: {
    fontSize: 16,
    marginTop: 1,
  },
  scenarioText: {
    flex: 1,
    color: NAVY,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Chat area
  chatArea: {
    flex: 1,
  },
  chatContent: {
    gap: 12,
    paddingBottom: 8,
  },

  // Guest bubble
  guestBlock: {
    alignItems: 'flex-start',
    maxWidth: '78%',
  },
  guestLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 2,
  },
  guestBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  guestBubbleText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  speakerBtn: {
    marginTop: 5,
    marginLeft: 4,
  },

  // User bubble
  userBlock: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '78%',
  },
  userLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginRight: 2,
  },
  userBubble: {
    backgroundColor: '#143F86',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },

  // Typing indicator
  typingRow: {
    alignItems: 'flex-start',
  },
  typingDots: {
    fontSize: 28,
    color: '#9CA3AF',
    letterSpacing: 2,
  },

  // Input panel
  inputPanel: {
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 10,
  },
  yourTurnLabel: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
  },
  expectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  expectedText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  hearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hearBtnText: {
    color: '#143F86',
    fontSize: 13,
    fontWeight: '500',
  },
  hearingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  diffBlock: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  retryText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  helpBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
})
