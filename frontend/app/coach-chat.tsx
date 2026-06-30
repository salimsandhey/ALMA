import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { Audio, InterruptionModeIOS } from 'expo-av'
import { api } from '../lib/api'
import TTSButton from '../components/TTSButton'
import { useAuthStore } from '../stores/authStore'
import { useVoiceStore, getSpeakOptions } from '../stores/voiceStore'
import { NAVY, GOLD, GREEN, GREY, BG } from '../constants/colors'
import Constants from 'expo-constants'

const IS_EXPO_GO = Constants.appOwnership === 'expo'
const _speechMod = IS_EXPO_GO ? null : (() => {
  try { return require('expo-speech-recognition') } catch { return null }
})()
const SpeechModule = _speechMod?.ExpoSpeechRecognitionModule ?? null
const useSpeechHook: (event: string, cb: (e: any) => void) => void =
  _speechMod?.useSpeechRecognitionEvent ?? ((_e: string, _cb: any) => {})
const IS_NATIVE = SpeechModule !== null

type Role = 'user' | 'assistant'

type GrammarResult = {
  hasError: boolean
  correctedText: string
  explanation: string
  errorType: string | null
  betterToSay: { original: string; corrected: string; explanation: string } | null
}

type ChatMessage = {
  id: string
  role: Role
  content: string
  feedback?: string | null
  correction?: string | null
  grammarResult?: GrammarResult | null
  grammarLoading?: boolean
  feedbackExpanded?: boolean
}

type CoachStatus = {
  messagesUsed: number
  messagesRemaining: number
  canChat: boolean
}

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function CoachChat() {
  const router = useRouter()
  const { user } = useAuthStore()
  const voiceGender = useVoiceStore((s) => s.voiceGender)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [status, setStatus] = useState<CoachStatus | null>(null)
  const [outOfCredits, setOutOfCredits] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)
  const didMount = useRef(false)

  useEffect(() => {
    return () => { Speech.stop() }
  }, [])

  const speakText = useCallback(async (text: string) => {
    Speech.stop()
    if (Platform.OS === 'ios') {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
        await new Promise<void>((r) => setTimeout(r, 80))
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          staysActiveInBackground: false,
        })
        await new Promise<void>((r) => setTimeout(r, 200))
      } catch { /* non-fatal */ }
    }
    const clean = text.replace(/\p{Emoji}/gu, '').replace(/\s{2,}/g, ' ').trim()
    Speech.speak(clean, getSpeakOptions(voiceGender))
  }, [voiceGender])

  // STT events
  useSpeechHook('result', (e: any) => {
    const transcript: string = e.results?.[0]?.transcript ?? ''
    if (!transcript) return
    if (e.isFinal) {
      setInputText(transcript)
      setInterimText('')
      setListening(false)
      if (Platform.OS === 'ios') { try { SpeechModule?.abort() } catch {} }
    } else {
      setInterimText(transcript)
    }
  })
  useSpeechHook('end', () => {
    setListening(false)
    setInterimText('')
    if (Platform.OS === 'ios') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        staysActiveInBackground: false,
      }).catch(() => {})
    }
  })
  useSpeechHook('error', () => { setListening(false); setInterimText('') })

  // Pulse animation for mic
  useEffect(() => {
    if (listening) {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
        ])
      )
      pulseLoop.current.start()
    } else {
      pulseLoop.current?.stop()
      pulseAnim.setValue(1)
      pulseOpacity.setValue(1)
    }
  }, [listening])

  // Initialize: check status, start session, get opening message
  useEffect(() => {
    if (didMount.current) return
    didMount.current = true
    initialize()
  }, [])

  const initialize = async () => {
    try {
      const { data: statusData } = await api.get('/api/ai/coach/status')
      setStatus(statusData)

      if (!statusData.canChat) {
        setOutOfCredits(true)
        setIsInitializing(false)
        return
      }

      await fetchAlmaReply([])
    } catch {
      await fetchAlmaReply([])
    } finally {
      setIsInitializing(false)
    }
  }

  const fetchAlmaReply = async (msgs: ChatMessage[]) => {
    setIsLoading(true)
    try {
      const apiMessages = msgs.map((m) => ({ role: m.role, content: m.content }))
      const { data } = await api.post('/api/ai/coach/message', { messages: apiMessages })

      const newMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: data.reply,
        feedback: data.feedback ?? null,
        correction: data.correction ?? null,
      }

      setMessages((prev) => [...prev, newMsg])

      if (data.messagesRemaining !== undefined) {
        setStatus((prev) => prev ? { ...prev, messagesRemaining: data.messagesRemaining } : prev)
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      speakText(data.reply)
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setOutOfCredits(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? inputText).trim()
    if (!content || isLoading) return
    if (status?.messagesRemaining === 0) {
      setOutOfCredits(true)
      return
    }

    setInputText('')

    const userMsg: ChatMessage = { id: uid(), role: 'user', content }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)

    await fetchAlmaReply(updatedMessages)
  }, [inputText, isLoading, messages, status])

  const handleMicPress = async () => {
    if (isLoading) return

    // Stop any ongoing TTS before recording
    Speech.stop()

    if (!IS_NATIVE) {
      // Web/Expo Go fallback: just focus input
      inputRef.current?.focus()
      return
    }

    if (listening) {
      SpeechModule.stop()
      setListening(false)
      return
    }

    try {
      const perm = await SpeechModule.requestPermissionsAsync()
      if (!perm.granted) return
    } catch { return }

    setListening(true)
    try {
      await SpeechModule.start({ lang: 'en-US', interimResults: true, maxAlternatives: 1 })
    } catch {
      setListening(false)
    }
  }

  const toggleFeedback = (msgId: string) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, feedbackExpanded: !m.feedbackExpanded } : m
    ))
  }

  const loadGrammarFeedback = async (msg: ChatMessage) => {
    if (msg.grammarResult || msg.grammarLoading) {
      toggleFeedback(msg.id)
      return
    }

    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, grammarLoading: true, feedbackExpanded: true } : m))

    try {
      const { data } = await api.post('/api/ai/grammar-check', { text: msg.content })
      setMessages((prev) => prev.map((m) =>
        m.id === msg.id ? { ...m, grammarResult: data, grammarLoading: false } : m
      ))
    } catch (err: any) {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, grammarLoading: false, feedbackExpanded: false } : m))
      const errMsg = err?.response?.data?.error || 'Failed to verify grammar. Please try again.'
      Alert.alert('Grammar Check Limit', errMsg)
    }
  }

  // Out-of-credits screen
  if (outOfCredits) {
    return (
      <SafeAreaView style={styles.safeWhite}>
        <View style={styles.headerWhite}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ALMA Coach</Text>
          </View>
        </View>
        <View style={styles.outOfCreditsContainer}>
          <Text style={styles.outOfCreditsEmoji}>🌙</Text>
          <Text style={styles.outOfCreditsTitle}>You're out of messages for today!</Text>
          <Text style={styles.outOfCreditsSubtitle}>
            You've used all your ALMA Coach messages for today. Come back tomorrow to keep practicing!
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(student)/home')}>
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.safeWhite}>
        <View style={[styles.outOfCreditsContainer, { gap: 12 }]}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={{ color: GREY, fontSize: 14 }}>Starting ALMA Coach...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeWhite} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.headerWhite}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <View style={styles.headerAvatarRow}>
          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>ALMA Coach</Text>
            <View style={styles.headerSubRow}>
              <View style={styles.greenDotSmall} />
              <Text style={styles.headerSub}>English Practice</Text>
            </View>
          </View>
        </View>
        {status && (
          <View style={styles.msgCounter}>
            <Text style={styles.msgCounterText}>{status.messagesRemaining} left</Text>
          </View>
        )}
      </View>

      {/* Feedback banner */}
      <View style={styles.feedbackBanner}>
        <Text style={styles.feedbackBannerText}>
          Speak or type — tap ✦ Get Feedback on your messages
        </Text>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) =>
            msg.role === 'assistant' ? (
              <AlmaMessage key={msg.id} msg={msg} />
            ) : (
              <UserMessage key={msg.id} msg={msg} onFeedback={loadGrammarFeedback} onToggle={toggleFeedback} onSpeak={speakText} />
            )
          )}
          {isLoading && (
            <View style={styles.almaRow}>
              <View style={styles.almaAvatarSmall}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingDots}>● ● ●</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Live transcript preview */}
        {interimText.length > 0 && (
          <View style={styles.interimPreview}>
            <Ionicons name="mic" size={12} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.interimPreviewText} numberOfLines={2}>{interimText}</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Speak or type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            editable={!isLoading}
          />
          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => sendMessage()}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.micBtnWrapper}>
              {listening && (
                <Animated.View
                  style={[
                    styles.micPulse,
                    { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                  ]}
                />
              )}
              <TouchableOpacity
                style={[styles.micBtnSmall, listening && styles.micBtnActive]}
                onPress={handleMicPress}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name={listening ? 'stop' : 'mic'} size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── ALMA Message ─────────────────────────────────────────────────────────────

function AlmaMessage({ msg }: { msg: ChatMessage }) {
  return (
    <View style={styles.almaRow}>
      <View style={styles.almaAvatarSmall}>
        <Text style={{ fontSize: 14 }}>🤖</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.almaBubble}>
          <Text style={styles.almaBubbleText}>{msg.content}</Text>
          <TTSButton text={msg.content} size={14} color={NAVY} idleColor="#9CA3AF" style={styles.ttsBtn} />
        </View>
        {msg.feedback && (
          <View style={styles.feedbackLine}>
            <Ionicons name="checkmark-circle" size={13} color={GREEN} />
            <Text style={styles.feedbackLineText}>{msg.feedback}</Text>
          </View>
        )}
        {msg.correction && (
          <View style={styles.correctionLine}>
            <Ionicons name="pencil-outline" size={12} color={GOLD} />
            <Text style={styles.correctionLineText}>{msg.correction}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ─── User Message ─────────────────────────────────────────────────────────────

function UserMessage({
  msg,
  onFeedback,
  onToggle,
  onSpeak,
}: {
  msg: ChatMessage
  onFeedback: (m: ChatMessage) => void
  onToggle: (id: string) => void
  onSpeak: (text: string) => void
}) {
  const gr = msg.grammarResult

  return (
    <View style={styles.userBlock}>
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{msg.content}</Text>
        </View>
      </View>

      {/* Get Feedback toggle */}
      <TouchableOpacity
        style={styles.feedbackToggle}
        onPress={() => onFeedback(msg)}
        activeOpacity={0.7}
      >
        {msg.grammarLoading ? (
          <ActivityIndicator size="small" color={NAVY} style={{ marginRight: 4 }} />
        ) : (
          <Text style={styles.feedbackToggleIcon}>✦</Text>
        )}
        <Text style={styles.feedbackToggleText}>Get Feedback</Text>
        <Ionicons
          name={msg.feedbackExpanded ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={NAVY}
        />
      </TouchableOpacity>

      {/* Expanded feedback cards */}
      {msg.feedbackExpanded && gr && (
        <View style={styles.feedbackCards}>
          {gr.hasError && (
            <View style={styles.grammarCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardTag, { backgroundColor: GOLD }]}>
                  <Text style={styles.cardTagText}>Grammar Check</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onSpeak([gr.correctedText, gr.explanation].filter(Boolean).join('. '))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.cardSpeakBtn}
                >
                  <Ionicons name="volume-medium-outline" size={16} color={GOLD} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardDiff}>
                <Text style={styles.cardOriginalText}>{gr.explanation ? msg.content : gr.correctedText}</Text>
                <Ionicons name="arrow-forward" size={14} color={GREY} style={{ marginHorizontal: 6 }} />
                <View style={styles.cardCorrectedWrap}>
                  <Text style={styles.cardCorrectedText}>{gr.correctedText}</Text>
                </View>
              </View>
              {gr.explanation ? <Text style={styles.cardExplanation}>{gr.explanation}</Text> : null}
            </View>
          )}

          {gr.betterToSay && (
            <View style={styles.grammarCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardTag, { backgroundColor: '#818CF8' }]}>
                  <Text style={styles.cardTagText}>Better to Say</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onSpeak([gr.betterToSay!.corrected, gr.betterToSay!.explanation].filter(Boolean).join('. '))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.cardSpeakBtn}
                >
                  <Ionicons name="volume-medium-outline" size={16} color="#818CF8" />
                </TouchableOpacity>
              </View>
              <View style={styles.cardDiff}>
                <Text style={styles.cardOriginalText}>{gr.betterToSay.original}</Text>
                <Ionicons name="arrow-forward" size={14} color={GREY} style={{ marginHorizontal: 6 }} />
                <View style={[styles.cardCorrectedWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.cardCorrectedText, { color: '#4338CA' }]}>{gr.betterToSay.corrected}</Text>
                </View>
              </View>
              <Text style={styles.cardExplanation}>{gr.betterToSay.explanation}</Text>
            </View>
          )}

          {!gr.hasError && !gr.betterToSay && (
            <View style={styles.grammarCard}>
              <View style={styles.feedbackLine}>
                <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                <Text style={[styles.feedbackLineText, { fontSize: 13 }]}>
                  No grammar issues found! Great English!
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safeWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ── Header ────────────────────────────────────────────
  headerWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatarRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCenter: {
    flex: 1,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  greenDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  headerSub: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '500',
  },
  msgCounter: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  msgCounterText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Feedback banner ────────────────────────────────────
  feedbackBanner: {
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  feedbackBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  // ── Interim preview ────────────────────────────────────
  interimPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  interimPreviewText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // ── Chat ────────────────────────────────────────────────
  chatScroll: {
    flex: 1,
    backgroundColor: BG,
  },
  chatContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 16,
  },
  almaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  almaAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  almaBubble: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  almaBubbleText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
  },
  ttsBtn: {
    padding: 2,
  },
  feedbackLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    marginLeft: 2,
  },
  feedbackLineText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  correctionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    marginLeft: 2,
  },
  correctionLineText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingDots: {
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 3,
  },
  // ── User messages ──────────────────────────────────────
  userBlock: {
    alignItems: 'flex-end',
    gap: 6,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: NAVY,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  feedbackToggleIcon: {
    color: NAVY,
    fontSize: 11,
  },
  feedbackToggleText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackCards: {
    width: '90%',
    gap: 8,
  },
  grammarCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSpeakBtn: {
    padding: 2,
  },
  cardTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDiff: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardOriginalText: {
    color: '#9CA3AF',
    fontSize: 13,
    textDecorationLine: 'line-through',
    flexShrink: 1,
  },
  cardCorrectedWrap: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardCorrectedText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },
  cardExplanation: {
    color: GREY,
    fontSize: 12,
    lineHeight: 17,
  },
  // ── Input bar ──────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  micBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
  // ── Out of credits ─────────────────────────────────────
  outOfCreditsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  outOfCreditsEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  outOfCreditsTitle: {
    color: NAVY,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  outOfCreditsSubtitle: {
    color: GREY,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  backHomeBtn: {
    marginTop: 8,
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
})
