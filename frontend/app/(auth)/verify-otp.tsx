import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { api } from '../../lib/api'
import { saveToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'
import { NAVY, GOLD, WHITE } from '../../constants/colors'

const RESEND_SECONDS = 47

export default function VerifyOtp() {
  const router = useRouter()
  const params = useLocalSearchParams<{ userId: string; purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'; email?: string }>()
  const userId = params.userId ?? ''
  const purpose = (params.purpose ?? 'EMAIL_VERIFICATION') as 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  const email = params.email ?? ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [timerActive, setTimerActive] = useState(true)

  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null, null, null])

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [])

  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) return
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setTimerActive(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActive, secondsLeft])

  const code = digits.join('')
  const isFilled = code.length === 6

  const submitOtp = useCallback(async () => {
    const otp = digits.join('')
    if (otp.length !== 6) return

    setLoading(true)
    setError(null)
    try {
      if (purpose === 'EMAIL_VERIFICATION') {
        const { data } = await api.post('/api/auth/verify-otp', {
          userId,
          code: otp,
          purpose: 'EMAIL_VERIFICATION',
        })
        await saveToken(data.token)
        useAuthStore.getState().setAuth(data.token, data.user)
        router.replace('/(onboarding)/name')
      } else {
        const { data } = await api.post('/api/auth/verify-reset-otp', { userId, code: otp })
        router.replace({ pathname: '/(auth)/reset-password', params: { resetToken: data.resetToken } })
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Invalid code. Please try again.')
      setDigits(['', '', '', '', '', ''])
      setFocusedIndex(0)
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }, [digits, purpose, router, userId])

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(null)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits]
        next[index - 1] = ''
        setDigits(next)
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      }
    }
  }

  const handleResend = async () => {
    if (timerActive) return
    try {
      await api.post('/api/auth/resend-otp', { userId, purpose })
      setSecondsLeft(RESEND_SECONDS)
      setTimerActive(true)
      setDigits(['', '', '', '', '', ''])
      setFocusedIndex(0)
      setError(null)
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to resend code.')
    }
  }

  const formatTime = (s: number) => `0:${String(s).padStart(2, '0')}`

  const title = purpose === 'PASSWORD_RESET' ? 'Verify Reset Code' : 'Verify Your Email Address'
  const destination = email || 'your email'

  return (
    <LinearGradient
      colors={[
        '#093373', '#09316F', '#0A2F6B', '#0A2D67', '#0A2B63',
        '#0A295F', '#0A275B', '#0A2557', '#0A275B', '#0A295F',
        '#0A2B63', '#0A2D67', '#0A2F6B', '#09316F', '#093373',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerContent}>
              <View style={styles.logoPill}>
                <Text style={styles.logoText}>A.L.M.A</Text>
              </View>

              <Text style={styles.title}>{title}</Text>

              <Text style={styles.subtitle}>
                We sent an activation authentication code to
              </Text>
              <Text style={styles.destination}>{destination}</Text>

              <View style={styles.boxesRow}>
                {digits.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { inputRefs.current[i] = ref }}
                    style={[
                      styles.box,
                      focusedIndex === i ? styles.boxFocused : styles.boxBlurred,
                    ]}
                    value={digit}
                    onChangeText={val => handleDigitChange(val, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    returnKeyType="done"
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.wrongRow}>
                <Text style={styles.wrongText}>Wrong email address? </Text>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                  <Text style={styles.goldText}>Go Back</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.continueBtn, !isFilled && styles.continueBtnDisabled]}
                onPress={submitOtp}
                disabled={!isFilled || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={NAVY} />
                  : <Text style={[styles.continueBtnText, !isFilled && styles.continueBtnTextDisabled]}>
                      Continue
                    </Text>
                }
              </TouchableOpacity>

              {timerActive
                ? <Text style={styles.timerText}>Resend Code in {formatTime(secondsLeft)}</Text>
                : <View style={styles.timerPlaceholder} />
              }
            </View>

            <View style={styles.resendRow}>
              <Text style={styles.resendBaseText}>Haven't received the OTP yet? </Text>
              <TouchableOpacity onPress={handleResend} disabled={timerActive} activeOpacity={0.7}>
                <Text style={[styles.resendLink, timerActive && styles.resendLinkDisabled]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  kav: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoPill: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginBottom: 32,
  },

  logoText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 5,
    textAlign: 'center',
  },

  title: {
    color: WHITE,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  destination: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 36,
  },

  boxesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },

  box: {
    width: 48,
    height: 56,
    backgroundColor: WHITE,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    color: NAVY,
  },

  boxFocused: {
    borderWidth: 2,
    borderColor: GOLD,
  },

  boxBlurred: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },

  errorText: {
    color: '#FF5C5C',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  wrongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 28,
  },

  wrongText: {
    color: WHITE,
    fontSize: 13,
  },

  goldText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },

  continueBtn: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginBottom: 20,
  },

  continueBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  continueBtnText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  continueBtnTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },

  timerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
  },

  timerPlaceholder: {
    height: 20,
  },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 32,
    paddingBottom: 8,
  },

  resendBaseText: {
    color: WHITE,
    fontSize: 13,
  },

  resendLink: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },

  resendLinkDisabled: {
    color: 'rgba(255,255,255,0.35)',
  },
})