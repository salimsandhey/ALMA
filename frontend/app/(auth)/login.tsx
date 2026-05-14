import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import Svg, { Path } from 'react-native-svg'
import { api } from '../../lib/api'
import { saveToken, deleteToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const WHITE = '#FFFFFF'

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.error || error?.message || fallback
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [forgotVisible, setForgotVisible] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isLoginEnabled = emailRegex.test(email.trim()) && password.trim().length > 0

  const openForgot = () => {
    setForgotEmail(email)
    setForgotError(null)
    setResetSuccess(null)
    setForgotVisible(true)
  }

  const handleForgotSend = async () => {
    if (!forgotEmail) { setForgotError('Please enter your email address'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) { setForgotError('Please enter a valid email address'); return }

    setForgotLoading(true)
    setForgotError(null)
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: forgotEmail })
      setForgotVisible(false)
      setResetSuccess(data?.message || 'OTP sent to your email.')
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { userId: data.userId, purpose: 'PASSWORD_RESET', email: forgotEmail },
      })
    } catch (e: any) {
      setForgotError(getErrorMessage(e, 'Something went wrong'))
    } finally {
      setForgotLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      await saveToken(data.token)
      useAuthStore.getState().setAuth(data.token, data.user)

      if (!data.user.isOnboardingComplete) {
        router.replace('/(onboarding)/name')
      } else if (data.user.role === 'ADMIN') {
        router.replace('/(admin)/overview')
      } else {
        router.replace('/(student)/home')
      }
    } catch (e: any) {
      const backendCode = e?.response?.data?.code
      const backendError = e?.response?.data?.error
      if (backendCode === 'EMAIL_NOT_VERIFIED' && e?.response?.data?.userId) {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            userId: e.response.data.userId,
            purpose: 'EMAIL_VERIFICATION',
            email,
          },
        })
      }
      setError(backendError || getErrorMessage(e, 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL
      if (!baseUrl) {
        setError('API URL is not configured.')
        return
      }
      await Linking.openURL(`${baseUrl}/api/auth/google`)
    } catch (e: any) {
      setError(getErrorMessage(e, 'Unable to start Google sign-in'))
    }
  }

  return (
    <LinearGradient
      colors={[
        '#093373','#09316F','#0A2F6B','#0A2D67','#0A2B63',
        '#0A295F','#0A275B','#0A2557','#0A275B','#0A295F',
        '#0A2B63','#0A2D67','#0A2F6B','#09316F','#093373',
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
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.welcome}>Welcome to A.L.M.A!</Text>
          <Text style={styles.subtitle}>Lets get started! Login or create an account to continue</Text>

          <View style={styles.authModeRow}>
            <Text style={styles.authModeText}>Email Login</Text>
            <View style={styles.authModeUnderline} />
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="rgba(0,0,0,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="rgba(0,0,0,0.4)"
                />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
              <TouchableOpacity onPress={openForgot}>
                <Text style={styles.forgotInlineText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.loginBtn,
                (!isLoginEnabled || loading) && styles.loginBtnDisabled,
              ]}
              onPress={handleEmailLogin}
              disabled={!isLoginEnabled || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={NAVY} />
                : <Text style={[styles.loginBtnText, !isLoginEnabled && styles.loginBtnTextDisabled]}>Login</Text>
              }
            </TouchableOpacity>

            {resetSuccess ? (
              <Text style={styles.resetSuccessText}>{resetSuccess}</Text>
            ) : null}

          </View>

          <View style={styles.orRowOutside}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            activeOpacity={0.85}
          >
            <GoogleIcon />
            <Text style={styles.googleText}>Sign In with Google</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Haven't an account yet? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Forgot Password?</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email address and we'll send you a reset link.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={forgotEmail}
              onChangeText={v => { setForgotEmail(v); setForgotError(null) }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {forgotError ? (
              <Text style={styles.modalError}>{forgotError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.modalBtn, forgotLoading && { opacity: 0.75 }]}
              onPress={handleForgotSend}
              disabled={forgotLoading}
              activeOpacity={0.85}
            >
              {forgotLoading
                ? <ActivityIndicator color={NAVY} />
                : <Text style={styles.modalBtnText}>Send Reset Link</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setForgotVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.805 10.023h-9.623v3.955h5.52c-.238 1.27-.952 2.345-2.023 3.065v2.546h3.27c1.913-1.762 3.015-4.36 3.015-7.422 0-.721-.065-1.414-.159-2.144Z"
        fill="#4285F4"
      />
      <Path
        d="M12.182 22c2.73 0 5.018-.903 6.691-2.411l-3.27-2.546c-.908.608-2.069.966-3.421.966-2.63 0-4.86-1.776-5.657-4.164H3.151v2.627A10.095 10.095 0 0 0 12.182 22Z"
        fill="#34A853"
      />
      <Path
        d="M6.525 13.845a6.06 6.06 0 0 1-.316-1.927c0-.669.114-1.321.316-1.927V7.364H3.151A10.095 10.095 0 0 0 2 11.918c0 1.635.392 3.184 1.151 4.554l3.374-2.627Z"
        fill="#FBBC05"
      />
      <Path
        d="M12.182 5.827c1.485 0 2.817.511 3.866 1.513l2.901-2.901C17.195 2.8 14.907 2 12.182 2A10.095 10.095 0 0 0 3.151 7.364l3.374 2.627c.798-2.388 3.028-4.164 5.657-4.164Z"
        fill="#EA4335"
      />
    </Svg>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },

  logoImage: {
    width: 160,
    height: 52,
    marginBottom: 20,
  },

  welcome: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
    lineHeight: 20,
  },

  authModeRow: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  authModeText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  authModeUnderline: {
    width: '100%',
    height: 2,
    borderRadius: 2,
    backgroundColor: GOLD,
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  fieldLabel: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },

  input: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14,
    color: '#111',
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14,
    color: '#111',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  forgotInlineText: {
    color: WHITE,
    fontSize: 13,
  },

  errorText: {
    color: '#FF5C5C',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  resetSuccessText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },

  loginBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
  },
  loginBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  loginBtnText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginBtnTextDisabled: {
    color: 'rgba(11,31,75,0.55)',
  },

  orRow: {
    display: 'none',
  },
  orRowOutside: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 18,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  orText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },

  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 26,
    paddingVertical: 16,
    gap: 12,
  },
  googleText: {
    color: '#202124',
    fontSize: 17,
    fontWeight: '500',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  registerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  registerLink: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    color: NAVY,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14,
    color: '#111',
    marginBottom: 12,
  },
  modalError: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
modalBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalBtnText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  modalCancelText: {
    color: '#999',
    fontSize: 13,
  },
})
