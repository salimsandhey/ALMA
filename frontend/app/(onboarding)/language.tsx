import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const BG = '#F2F3F7'
const WHITE = '#FFFFFF'

type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'
type LanguageValue = 'fr' | 'sw' | 'ar' | 'mg' | 'ur'

const languages: { flag: string; label: string; value: LanguageValue }[] = [
  { flag: '\uD83C\uDDEB\uD83C\uDDF7', label: 'Fran\u00E7ais', value: 'fr' },
  { flag: '\uD83C\uDDF0\uD83C\uDDEA', label: 'Kiswahili', value: 'sw' },
  { flag: '\uD83C\uDDF8\uD83C\uDDE6', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', value: 'ar' },
  { flag: '\uD83C\uDDF2\uD83C\uDDEC', label: 'Malagasy', value: 'mg' },
  { flag: '\uD83C\uDDF5\uD83C\uDDF0', label: '\u0627\u064F\u0631\u062F\u0648', value: 'ur' },
]

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i <= step ? NAVY : '#D1D5DB' },
          ]}
        />
      ))}
    </View>
  )
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton}>
      <Text style={styles.backText}>{'\u2190  Back'}</Text>
    </TouchableOpacity>
  )
}

export default function OnboardingLanguageScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    displayName?: string
    age?: string
    gender?: Gender
  }>()

  const displayName = typeof params.displayName === 'string' ? params.displayName : ''
  const age = typeof params.age === 'string' ? params.age : ''
  const gender = typeof params.gender === 'string' ? (params.gender as Gender) : undefined

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageValue | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedLanguage || !gender) return

    try {
      setLoading(true)
      setError(null)

      const { data } = await api.patch('/api/auth/onboarding', {
        displayName,
        age: Number(age),
        gender,
        nativeLanguage: selectedLanguage,
      })

      useAuthStore.getState().setUser(data.user)
      router.replace('/(student)/home')
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => router.back()} />
          <ProgressBar step={3} />

          <Text style={styles.emoji}>{'\uD83C\uDF0D'}</Text>
          <Text style={styles.title}>Your native language?</Text>
          <Text style={styles.subtitle}>Used for translations during lessons.</Text>

          <View style={styles.languageList}>
            {languages.map((language) => {
              const selected = selectedLanguage === language.value
              return (
                <TouchableOpacity
                  key={language.value}
                  style={[styles.languageItem, selected ? styles.languageItemSelected : styles.languageItemDefault]}
                  onPress={() => {
                    setSelectedLanguage(language.value)
                    if (error) setError(null)
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageLabel}>{language.label}</Text>
                  </View>
                  <Text style={[styles.checkmark, !selected && styles.hiddenCheckmark]}>{'\u2713'}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <TouchableOpacity
          style={[styles.ctaButton, (!selectedLanguage || loading) && styles.ctaButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedLanguage || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={NAVY} /> : <Text style={styles.ctaText}>Let's Go!</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  emoji: {
    fontSize: 40,
    marginTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: NAVY,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  languageList: {
    marginTop: 28,
    gap: 10,
  },
  languageItem: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageItemSelected: {
    borderColor: NAVY,
    backgroundColor: 'rgba(11,31,75,0.06)',
  },
  languageItemDefault: {
    borderColor: '#E5E7EB',
    backgroundColor: WHITE,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: NAVY,
    fontWeight: '700',
  },
  hiddenCheckmark: {
    opacity: 0,
  },
  errorText: {
    marginTop: 12,
    color: '#EF4444',
    fontSize: 13,
  },
  ctaButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  ctaButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  ctaText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
})
