import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'

const NAVY = '#093373'
const GOLD = '#F5A623'
const WHITE = '#FFFFFF'

function usePasswordRules(value: string) {
  return {
    hasLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecialChar: /[^A-Za-z0-9]/.test(value),
  }
}

export default function ResetPassword() {
  const router = useRouter()
  const params = useLocalSearchParams<{ resetToken?: string }>()
  const resetToken = typeof params.resetToken === 'string' ? params.resetToken : ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rules = usePasswordRules(newPassword)
  const allRulesMet = rules.hasLength && rules.hasUppercase && rules.hasNumber && rules.hasSpecialChar
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const canSubmit = allRulesMet && passwordsMatch

  const handleReset = async () => {
    if (!resetToken) {
      setError('Reset token is missing. Please request a new reset code.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }
    if (!allRulesMet) {
      setError('Password does not meet all requirements')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/reset-password', {
        resetToken,
        newPassword,
      })

      Alert.alert('Success', data?.message || 'Password reset successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ])
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
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
            <Text style={styles.logoText}>A.L.M.A</Text>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Create a new secure password for your account.{"\n"}Must be at least 8 characters.
            </Text>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={newPassword}
                  onChangeText={v => { setNewPassword(v); setError(null) }}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNew(v => !v)}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(0,0,0,0.4)"
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Re-Type Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-Type new password"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={confirmPassword}
                  onChangeText={v => { setConfirmPassword(v); setError(null) }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(v => !v)}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(0,0,0,0.4)"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.rulesBox}>
                <Text style={styles.rulesTitle}>Password must contain:</Text>
                <RuleRow met={rules.hasLength} label="At least 8 characters" />
                <RuleRow met={rules.hasUppercase} label="One uppercase letter" />
                <RuleRow met={rules.hasNumber} label="One number" />
                <RuleRow met={rules.hasSpecialChar} label="One special character" />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.resetBtn, canSubmit ? styles.resetBtnActive : styles.resetBtnDisabled]}
                onPress={handleReset}
                disabled={!canSubmit || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={WHITE} />
                  : (
                    <Text style={[
                      styles.resetBtnText,
                      canSubmit ? styles.resetBtnTextActive : styles.resetBtnTextDisabled,
                    ]}>
                      Reset Your Password
                    </Text>
                  )
                }
              </TouchableOpacity>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Remember Your Password? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
                <Text style={styles.bottomLink}>Back to Login</Text>
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
        {met ? '✓' : '•'}
      </Text>
      <Text style={styles.ruleLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  root: { flex: 1 },
  fill: { flex: 1 },
  kav: { flex: 1 },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
  },

  logoText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 20,
  },

  title: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  card: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
  },

  fieldLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  textInput: {
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

  rulesBox: {
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },

  rulesTitle: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
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
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },

  resetBtn: {
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },

  resetBtnActive: {
    backgroundColor: NAVY,
  },

  resetBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },

  resetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  resetBtnTextActive: {
    color: WHITE,
  },

  resetBtnTextDisabled: {
    color: '#9CA3AF',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    flexWrap: 'wrap',
  },

  bottomText: {
    color: WHITE,
    fontSize: 13,
  },

  bottomLink: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
})
