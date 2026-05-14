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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import Svg, { Path } from 'react-native-svg'
import { api } from '../../lib/api'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const WHITE = '#FFFFFF'

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.error || error?.message || fallback
}

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordsMismatch =
    confirmPassword.length > 0 && password.length > 0 && password !== confirmPassword
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const allPasswordRulesMet = hasMinLength && hasUppercase && hasNumber && hasSpecialChar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isSignUpEnabled =
    emailRegex.test(email.trim()) &&
    allPasswordRulesMet &&
    confirmPassword.trim().length >= 8 &&
    !passwordsMismatch &&
    acceptedTerms

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match')
      return
    }

    if (!allPasswordRulesMet) {
      setError('Password must be at least 8 characters and include uppercase, number, and special character')
      return
    }

    if (!acceptedTerms) {
      setError('Please accept Terms & Conditions and Privacy Policy')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/register', { email, password })
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          userId: data.userId,
          purpose: 'EMAIL_VERIFICATION',
          email,
        },
      })
    } catch (e: any) {
      setError(getErrorMessage(e, 'Unable to create account'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL
      if (!baseUrl) {
        setError('API URL is not configured.')
        return
      }
      await Linking.openURL(`${baseUrl}/api/auth/google`)
    } catch (e: any) {
      setError(getErrorMessage(e, 'Unable to start Google sign-up'))
    }
  }

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
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

          <Text style={styles.heading}>Welcome to A.L.M.A!</Text>
          <Text style={styles.subtitle}>Lets get started! Register to create your account</Text>

          <View style={styles.authModeRow}>
            <Text style={styles.authModeText}>Email Sign Up</Text>
            <View style={styles.authModeUnderline} />
          </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Email Address</Text>
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

              <Text style={[styles.fieldLabel, styles.withTopGap]}>Password</Text>
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

              <Text style={[styles.fieldLabel, styles.withTopGap]}>Confirm Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(v => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(0,0,0,0.4)"
                  />
                </TouchableOpacity>
              </View>

              {passwordsMismatch ? (
                <Text style={styles.errorText}>Password and Confirm Password must match</Text>
              ) : null}
              <View style={styles.rulesBox}>
                <Text style={styles.rulesTitle}>Password must contain:</Text>
                <RuleRow met={hasMinLength} label="At least 8 characters" />
                <RuleRow met={hasUppercase} label="One uppercase letter" />
                <RuleRow met={hasNumber} label="One number" />
                <RuleRow met={hasSpecialChar} label="One special character" />
              </View>

              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAcceptedTerms(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms ? <Ionicons name="checkmark" size={10} color={WHITE} /> : null}
                </View>
                <Text style={styles.termsText}>I agree to the </Text>
                <TouchableOpacity activeOpacity={0.8}>
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity activeOpacity={0.8}>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.signUpBtn,
                  (!isSignUpEnabled || loading) && styles.signUpBtnDisabled,
                ]}
                onPress={handleRegister}
                disabled={!isSignUpEnabled || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={NAVY} />
                ) : (
                  <Text style={[styles.signUpBtnText, !isSignUpEnabled && styles.signUpBtnTextDisabled]}>
                    Sign Up
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.orRowOutside}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignUp}
              activeOpacity={0.85}
            >
              <GoogleIcon />
              <Text style={styles.googleText}>Sign Up with Google</Text>
            </TouchableOpacity>

            <View style={styles.signInRow}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

function RuleRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={[styles.ruleBullet, met && styles.ruleBulletMet]}>
        {met ? '?' : '•'}
      </Text>
      <Text style={styles.ruleLabel}>{label}</Text>
    </View>
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

  heading: {
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
  withTopGap: {
    marginTop: 14,
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

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
    columnGap: 4,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  termsText: {
    color: WHITE,
    fontSize: 13,
  },
  termsLink: {
    color: GOLD,
    fontSize: 13,
  },
  rulesBox: {
    backgroundColor: 'rgba(11,31,75,0.75)',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  rulesTitle: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ruleBullet: {
    color: WHITE,
    fontSize: 14,
    width: 16,
    textAlign: 'center',
  },
  ruleBulletMet: {
    color: '#4ADE80',
  },
  ruleLabel: {
    color: WHITE,
    fontSize: 12,
  },

  errorText: {
    color: '#FF5C5C',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  signUpBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  signUpBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  signUpBtnText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signUpBtnTextDisabled: {
    color: 'rgba(11,31,75,0.55)',
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

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  signInText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  signInLink: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
})
