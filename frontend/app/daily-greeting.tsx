import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, TextInput, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

const NAVY = '#093373'
const GOLD = '#F5A623'
const SESSION_SECONDS = 60
const SKIP_AFTER_SECONDS = 30

const _speechMod = (() => {
  try { return require('expo-speech-recognition') } catch { return null }
})()
const SpeechModule = _speechMod?.ExpoSpeechRecognitionModule ?? null
const useSpeechHook: (event: string, cb: (e: any) => void) => void =
  _speechMod?.useSpeechRecognitionEvent ?? ((_e: string, _cb: any) => {})
const IS_NATIVE = SpeechModule !== null

type Msg = { role: 'user' | 'assistant'; content: string }

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

function todayKey() {
  return `greeting_done_${new Date().toISOString().split('T')[0]}`
}

export default function DailyGreeting() {
  const router = useRouter()
  const { setGreetingDone } = useAuthStore()
  const [screen, setScreen] = useState<'intro' | 'chat'>('intro')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS)
  const [showSkip, setShowSkip] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const lastActivityRef = useRef(Date.now())
  const scrollRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Pulse animation for mic
  useEffect(() => {
    if (listening) {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
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

  // STT events
  useSpeechHook('result', (e: any) => {
    const transcript: string = e.results?.[0]?.transcript ?? ''
    if (!transcript) return
    if (e.isFinal) {
      setInterimText('')
      handleUserResponse(transcript)
    } else {
      setInterimText(transcript)
    }
  })
  useSpeechHook('end', () => { setListening(false); setInterimText('') })
  useSpeechHook('error', () => { setListening(false); setInterimText('') })

  const fetchAlmaReply = useCallback(async (msgs: Msg[]) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/ai/daily-greeting', { messages: msgs })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Good morning! How are you feeling today?" }])
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(() => {
    setScreen('chat')
    fetchAlmaReply([])
    lastActivityRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimeUp(true)
          return 0
        }
        const inactiveSecs = (Date.now() - lastActivityRef.current) / 1000
        if (inactiveSecs >= SKIP_AFTER_SECONDS) {
          setShowSkip(true)
        }
        return prev - 1
      })
    }, 1000)
  }, [fetchAlmaReply])

  const handleUserResponse = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    lastActivityRef.current = Date.now()
    setShowSkip(false)
    setListening(false)

    const updated: Msg[] = [...messages, { role: 'user', content: text.trim() }]
    setMessages(updated)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    await fetchAlmaReply(updated)
  }, [messages, loading, fetchAlmaReply])

  const handleMicPress = async () => {
    if (loading || timeUp) return

    if (!IS_NATIVE) {
      setFallbackText('')
      setFallbackVisible(true)
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
        setFallbackText('')
        setFallbackVisible(true)
        return
      }
    } catch { /* continue */ }

    setListening(true)
    try {
      await SpeechModule.start({ lang: 'en-US', interimResults: true, maxAlternatives: 1 })
    } catch {
      setListening(false)
    }
  }

  const handleFallbackSubmit = () => {
    const trimmed = fallbackText.trim()
    if (trimmed) handleUserResponse(trimmed)
    setFallbackVisible(false)
    setFallbackText('')
  }

  const markDoneAndGoHome = useCallback(async () => {
    await AsyncStorage.setItem(todayKey(), 'true')
    setGreetingDone(true)
    router.replace('/(student)/home')
  }, [router, setGreetingDone])

  // ── Intro gate ──────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.introContainer}>
          <Text style={styles.introEmoji}>🤖</Text>
          <Text style={styles.introTitle}>Good morning!</Text>
          <Text style={styles.introSubtitle}>
            ALMA Coach has a quick 60-second daily greeting for you.{'\n'}
            Ready to chat?
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start  ›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={markDoneAndGoHome} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Time's up screen
  if (timeUp) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.timeUpContainer}>
          <Text style={styles.timeUpEmoji}>⏰</Text>
          <Text style={styles.timeUpTitle}>Uh-oh! Time is up for today.</Text>
          <Text style={styles.timeUpSubtitle}>
            No worries, we can chat again tomorrow!{'\n'}Keep practicing, you're doing great.
          </Text>
          <TouchableOpacity style={styles.continueBtn} activeOpacity={0.85} onPress={markDoneAndGoHome}>
            <Text style={styles.continueBtnText}>Continue  ›</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>ALMA Coach</Text>
            <View style={styles.headerSubRow}>
              <View style={styles.greenDot} />
              <Text style={styles.headerSub}>Daily Greeting</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.timer, timeLeft <= 10 && styles.timerRed]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, i) =>
          msg.role === 'assistant' ? (
            <View key={i} style={styles.almaRow}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarEmoji}>🤖</Text>
              </View>
              <View style={styles.almaBubble}>
                <Text style={styles.almaBubbleText}>{msg.content}</Text>
              </View>
            </View>
          ) : (
            <View key={i} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>{msg.content}</Text>
              </View>
            </View>
          )
        )}
        {loading && (
          <View style={styles.almaRow}>
            <View style={styles.smallAvatar}>
              <Text style={styles.smallAvatarEmoji}>🤖</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>●  ●  ●</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Skip prompt */}
      {showSkip && !loading && (
        <View style={styles.skipBanner}>
          <Text style={styles.skipBannerText}>No rush! Tap below or</Text>
          <TouchableOpacity onPress={markDoneAndGoHome} activeOpacity={0.8}>
            <Text style={styles.skipLink}>  skip for today →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live transcript preview */}
      {interimText.length > 0 && (
        <View style={styles.interimPreview}>
          <Ionicons name="mic" size={12} color={GOLD} style={{ marginRight: 6 }} />
          <Text style={styles.interimPreviewText} numberOfLines={2}>{interimText}</Text>
        </View>
      )}

      {/* Mic */}
      <View style={styles.micContainer}>
        <Text style={styles.micLabel}>
          {listening ? 'Listening... speak now!' : 'Tap the mic to respond'}
        </Text>
        <View style={styles.micWrapper}>
          {listening && (
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
              ]}
            />
          )}
          <TouchableOpacity
            style={[styles.micButton, listening && styles.micButtonActive]}
            onPress={handleMicPress}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Ionicons name={listening ? 'stop' : 'mic-outline'} size={36} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fallback text input modal */}
      <Modal visible={fallbackVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Type your response</Text>
            <TextInput
              style={styles.modalInput}
              value={fallbackText}
              onChangeText={setFallbackText}
              placeholder="What would you say..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleFallbackSubmit}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFallbackVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleFallbackSubmit}>
                <Text style={styles.submitText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAVY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  headerText: {
    gap: 3,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  headerSub: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '500',
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerRed: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
  },
  almaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarEmoji: {
    fontSize: 16,
  },
  almaBubble: {
    maxWidth: '78%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  almaBubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: GOLD,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: {
    color: NAVY,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  typingBubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 2,
  },
  skipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipBannerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  skipLink: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  interimPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
  },
  interimPreviewText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  micContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  micLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  micWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  // Intro gate
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  introEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  introTitle: {
    color: GOLD,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  introSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 8,
  },
  startBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 10,
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // Time's up screen
  timeUpContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  timeUpEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  timeUpTitle: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  timeUpSubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    opacity: 0.85,
  },
  continueBtn: {
    marginTop: 16,
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  // Fallback modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#F9FAFB',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: NAVY,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
})
