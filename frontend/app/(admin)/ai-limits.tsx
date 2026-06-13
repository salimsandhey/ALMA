import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { NAVY, GOLD, BG, CARD } from '../../constants/colors'

type Settings = {
  coachDailyLimit: number
  greetingDailyLimit: number
  grammarDailyLimit: number
  warmupDailyLimit: number
  pronunciationDailyLimit: number
  hintDailyLimit: number
}

const FIELDS: { key: keyof Settings; label: string; subtitle: string; icon: string; color: string; bg: string; max: number }[] = [
  { key: 'coachDailyLimit',         label: 'AI Coach Messages',    subtitle: 'Max messages per user per day',      icon: 'chatbubbles-outline',  color: '#6366F1', bg: '#EEF2FF', max: 500 },
  { key: 'greetingDailyLimit',      label: 'Daily Greeting',       subtitle: 'Max greeting turns per user per day', icon: 'sunny-outline',        color: '#F59E0B', bg: '#FFFBEB', max: 100 },
  { key: 'grammarDailyLimit',       label: 'Grammar Checks',       subtitle: 'Max grammar checks per user per day', icon: 'checkmark-circle-outline', color: '#10B981', bg: '#ECFDF5', max: 500 },
  { key: 'warmupDailyLimit',        label: 'Warm-up Sessions',     subtitle: 'Max warm-up sessions per user per day', icon: 'fitness-outline',     color: '#EC4899', bg: '#FDF2F8', max: 50  },
  { key: 'pronunciationDailyLimit', label: 'Pronunciation Checks', subtitle: 'Max pronunciation checks per user per day', icon: 'mic-outline',    color: '#0891B2', bg: '#ECFEFF', max: 500 },
  { key: 'hintDailyLimit',          label: 'Help Explanations',    subtitle: 'Max in-game help requests per user per day', icon: 'help-circle-outline', color: '#8B5CF6', bg: '#F5F3FF', max: 50  },
]

export default function AiLimitsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/api/admin/settings')).data as Settings,
  })

  useEffect(() => {
    if (data) {
      const initial: Record<string, string> = {}
      FIELDS.forEach(({ key }) => { initial[key] = String(data[key]) })
      setDraft(initial)
      setHasUnsaved(false)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async (values: Settings) => {
      const res = await api.put('/api/admin/settings', values)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setHasUnsaved(false)
      Alert.alert('Saved', 'AI limits updated. New limits take effect within 60 seconds.')
    },
    onError: () => {
      Alert.alert('Error', 'Could not save settings. Please try again.')
    },
  })

  const handleChange = (key: string, val: string) => {
    setDraft((prev) => ({ ...prev, [key]: val }))
    setHasUnsaved(true)
  }

  const handleSave = () => {
    const parsed: Partial<Settings> = {}
    for (const { key, max } of FIELDS) {
      const n = parseInt(draft[key] ?? '')
      if (isNaN(n) || n < 1 || n > max) {
        Alert.alert('Invalid value', `"${FIELDS.find(f => f.key === key)?.label}" must be between 1 and ${max}.`)
        return
      }
      parsed[key] = n
    }
    mutation.mutate(parsed as Settings)
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>AI COACH</Text>
          <Text style={s.headerTitle}>Daily Limits</Text>
        </View>
        {hasUnsaved && (
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={s.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.hint}>
            These limits reset daily at midnight for each user. Changes take effect within 60 seconds.
          </Text>

          {FIELDS.map(({ key, label, subtitle, icon, color, bg }) => (
            <View key={key} style={s.card}>
              <View style={[s.iconWrap, { backgroundColor: bg }]}>
                <Ionicons name={icon as any} size={24} color={color} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardLabel}>{label}</Text>
                <Text style={s.cardSub}>{subtitle}</Text>
              </View>
              <TextInput
                style={s.input}
                value={draft[key] ?? ''}
                onChangeText={(v) => handleChange(key, v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
            </View>
          ))}

          {hasUnsaved && (
            <TouchableOpacity
              style={[s.footerBtn, mutation.isPending && s.footerBtnDisabled]}
              onPress={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.footerBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: BG },
  header:           { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerSub:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle:      { color: '#FFF', fontSize: 22, fontWeight: '700' },
  back:             { padding: 4 },
  saveBtn:          { backgroundColor: GOLD, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText:      { color: '#FFF', fontWeight: '700', fontSize: 14 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:           { padding: 16, paddingBottom: 40 },
  hint:             { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 19 },
  card:             { backgroundColor: CARD, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  iconWrap:         { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBody:         { flex: 1 },
  cardLabel:        { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  cardSub:          { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  input:            { width: 60, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: '700', color: NAVY, textAlign: 'center', backgroundColor: '#F9FAFB' },
  footerBtn:        { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  footerBtnDisabled:{ opacity: 0.6 },
  footerBtnText:    { color: '#FFF', fontSize: 16, fontWeight: '700' },
})
