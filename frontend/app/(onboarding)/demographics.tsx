import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F2F3F7'
const WHITE = '#FFFFFF'

type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'

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

const genderOptions: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
]

export default function OnboardingDemographicsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ displayName?: string }>()
  const displayName = typeof params.displayName === 'string' ? params.displayName : ''

  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    const ageNum = Number(age)
    if (!Number.isFinite(ageNum) || !Number.isInteger(ageNum) || ageNum < 10 || ageNum > 100) {
      setError('Please enter a valid age between 10 and 100')
      return
    }

    if (!gender) {
      setError('Please select your gender')
      return
    }

    setError(null)
    router.push({
      pathname: '/(onboarding)/language',
      params: {
        displayName,
        age: String(ageNum),
        gender,
      },
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
          <BackButton onPress={() => router.back()} />
          <ProgressBar step={2} />

          <Text style={styles.emoji}>{'\uD83D\uDCCB'}</Text>
          <Text style={styles.title}>A bit more about you</Text>
          <Text style={styles.subtitle}>This helps us tailor your learning path.</Text>

          <Text style={styles.sectionLabel}>YOUR AGE</Text>
          <TextInput
            value={age}
            onChangeText={(text) => {
              const onlyDigits = text.replace(/[^0-9]/g, '')
              setAge(onlyDigits)
              if (error) setError(null)
            }}
            placeholder="Enter your age"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            keyboardType="number-pad"
          />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>GENDER</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => {
              const selected = gender === option.value
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setGender(option.value)
                    if (error) setError(null)
                  }}
                  style={[styles.genderPill, selected ? styles.genderPillSelected : styles.genderPillDefault]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.genderText, selected ? styles.genderTextSelected : styles.genderTextDefault]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

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
  sectionLabel: {
    marginTop: 28,
    color: '#9CA3AF',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
  },
  input: {
    marginTop: 10,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: NAVY,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  genderPill: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  genderPillSelected: {
    borderColor: NAVY,
    backgroundColor: 'rgba(11,31,75,0.06)',
  },
  genderPillDefault: {
    borderColor: '#E5E7EB',
    backgroundColor: WHITE,
  },
  genderText: {
    fontSize: 14,
  },
  genderTextSelected: {
    color: NAVY,
    fontWeight: '700',
  },
  genderTextDefault: {
    color: '#374151',
    fontWeight: '500',
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
  },
  ctaText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
})
