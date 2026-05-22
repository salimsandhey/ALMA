import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SUGGESTED_LANGUAGES, ALL_LANGUAGES } from '../../lib/languages'

const NAVY = '#0B1F4B'
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

  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return null // show sectioned view
    const all = [...SUGGESTED_LANGUAGES, ...ALL_LANGUAGES]
    const seen = new Set<string>()
    return all.filter((l) => {
      if (seen.has(l.value)) return false
      seen.add(l.value)
      return l.label.toLowerCase().includes(q) || l.value.toLowerCase().includes(q)
    })
  }, [search])

  const handleContinue = () => {
    if (!selected || !gender) return
    router.push({
      pathname: '/(onboarding)/country',
      params: { displayName, age, gender, nativeLanguage: selected },
    })
  }

  const renderItem = (lang: { flag: string; label: string; value: string }) => {
    const isSelected = selected === lang.value
    return (
      <TouchableOpacity
        key={lang.value}
        style={[styles.item, isSelected ? styles.itemSelected : styles.itemDefault]}
        onPress={() => setSelected(lang.value)}
        activeOpacity={0.9}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemFlag}>{lang.flag}</Text>
          <Text style={styles.itemLabel}>{lang.label}</Text>
        </View>
        <Text style={[styles.checkmark, !isSelected && styles.hidden]}>✓</Text>
      </TouchableOpacity>
    )
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

          <Text style={styles.emoji}>🌍</Text>
          <Text style={styles.title}>Your native language?</Text>
          <Text style={styles.subtitle}>Used for translations during lessons.</Text>

          <TextInput
            style={styles.searchBox}
            value={search}
            onChangeText={setSearch}
            placeholder="Search language..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />

          <View style={styles.list}>
            {filteredList ? (
              filteredList.length > 0
                ? filteredList.map(renderItem)
                : <Text style={styles.emptyText}>No languages found</Text>
            ) : (
              <>
                <Text style={styles.sectionLabel}>SUGGESTED</Text>
                {SUGGESTED_LANGUAGES.map(renderItem)}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>ALL LANGUAGES</Text>
                {ALL_LANGUAGES.map((l) => {
                  // dedupe — skip if already in suggested
                  if (SUGGESTED_LANGUAGES.some((s) => s.value === l.value)) return null
                  return renderItem(l)
                })}
              </>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.cta, !selected && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Continue ›</Text>
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
  list: { marginTop: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
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
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemFlag: { fontSize: 22 },
  itemLabel: { fontSize: 16, color: '#111827', fontWeight: '500' },
  checkmark: { fontSize: 18, color: NAVY, fontWeight: '700' },
  hidden: { opacity: 0 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 24, fontSize: 14 },
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
  },
  ctaDisabled: { backgroundColor: '#D1D5DB' },
  ctaText: { color: NAVY, fontSize: 16, fontWeight: '700' },
})
