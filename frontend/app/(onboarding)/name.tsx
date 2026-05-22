import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const BG = '#F2F3F7'
const WHITE = '#FFFFFF'

function ProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3, 4].map((i) => (
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

export default function OnboardingNameScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ displayName?: string }>()
  const storeName = useAuthStore((s) => s.user?.displayName)

  const [displayName, setDisplayName] = useState(params.displayName ?? storeName ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }

    setError(null)
    router.push({
      pathname: '/(onboarding)/demographics',
      params: { displayName: trimmed },
    })
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
          <BackButton onPress={() => router.replace('/(auth)/login')} />
          <ProgressBar step={1} />

          <Text style={styles.emoji}>{'\uD83D\uDC4B'}</Text>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>We'll use this to personalise your experience.</Text>

          <TextInput
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text)
              if (error) setError(null)
            }}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <TouchableOpacity style={styles.ctaButton} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.ctaText}>Continue {'\u203A'}</Text>
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
  input: {
    marginTop: 28,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: NAVY,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorText: {
    marginTop: 10,
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
  },
  ctaText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
})
