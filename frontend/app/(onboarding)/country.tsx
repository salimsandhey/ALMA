import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { COUNTRIES, countryFlag } from '../../lib/countries'

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
          style={[styles.progressSegment, { backgroundColor: i <= step ? NAVY : '#D1D5DB' }]}
        />
      ))}
    </View>
  )
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton}>
      <Text style={styles.backText}>{'←  Back'}</Text>
    </TouchableOpacity>
  )
}

export default function OnboardingCountryScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    displayName?: string
    age?: string
    gender?: Gender
    nativeLanguage?: string
  }>()

  const displayName = typeof params.displayName === 'string' ? params.displayName : ''
  const age = typeof params.age === 'string' ? params.age : ''
  const gender = typeof params.gender === 'string' ? (params.gender as Gender) : undefined
  const nativeLanguage = typeof params.nativeLanguage === 'string' ? params.nativeLanguage : ''

  const [selected, setSelected] = useState<string | null>(null) // ISO code e.g. 'AE'
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return COUNTRIES
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
  }, [search])

  const handleSubmit = async () => {
    if (!selected || !gender) return
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.patch('/api/auth/onboarding', {
        displayName,
        age: Number(age),
        gender,
        nativeLanguage,
        country: selected,
      })
      useAuthStore.getState().setUser(data.user)
      router.replace('/(onboarding)/complete')
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Something went wrong. Please try again.')
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
          <ProgressBar step={4} />

          <Text style={styles.emoji}>🗺️</Text>
          <Text style={styles.title}>Where are you from?</Text>
          <Text style={styles.subtitle}>Your flag will appear on the leaderboard.</Text>

          <TextInput
            style={styles.searchBox}
            value={search}
            onChangeText={setSearch}
            placeholder="Search country..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />

          <View style={styles.list}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selected === country.code
                return (
                  <TouchableOpacity
                    key={country.code}
                    style={[styles.item, isSelected ? styles.itemSelected : styles.itemDefault]}
                    onPress={() => setSelected(country.code)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemFlag}>{countryFlag(country.code)}</Text>
                      <Text style={styles.itemLabel}>{country.name}</Text>
                    </View>
                    <Text style={[styles.checkmark, !isSelected && styles.hidden]}>✓</Text>
                  </TouchableOpacity>
                )
              })
            ) : (
              <Text style={styles.emptyText}>No countries found</Text>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <TouchableOpacity
          style={[styles.cta, (!selected || loading) && styles.ctaDisabled]}
          onPress={handleSubmit}
          disabled={!selected || loading}
          activeOpacity={0.9}
        >
          {loading
            ? <ActivityIndicator color={NAVY} />
            : <Text style={styles.ctaText}>Get Started!</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 100 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, color: '#6B7280' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  emoji: { fontSize: 40, marginTop: 32 },
  title: { fontSize: 26, fontWeight: '700', color: NAVY, marginTop: 12 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 6 },
  searchBox: {
    marginTop: 20,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: NAVY,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  list: { marginTop: 16, gap: 8 },
  item: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemSelected: { borderColor: NAVY, backgroundColor: 'rgba(11,31,75,0.06)' },
  itemDefault: { borderColor: '#E5E7EB', backgroundColor: WHITE },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemFlag: { fontSize: 22 },
  itemLabel: { fontSize: 15, color: '#111827', fontWeight: '500', flexShrink: 1 },
  checkmark: { fontSize: 18, color: NAVY, fontWeight: '700', marginLeft: 8 },
  hidden: { opacity: 0 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 24, fontSize: 14 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 13, textAlign: 'center' },
  cta: {
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
  ctaDisabled: { backgroundColor: '#D1D5DB' },
  ctaText: { color: NAVY, fontSize: 16, fontWeight: '700' },
})
