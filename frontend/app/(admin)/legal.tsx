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
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { NAVY, GOLD, BG, CARD, RED } from '../../constants/colors'

type Section = { title: string; body: string }
type Tab = 'terms' | 'privacy'

type LegalData = {
  terms:   { sections: Section[]; updatedAt: string | null; isDefault: boolean }
  privacy: { sections: Section[]; updatedAt: string | null; isDefault: boolean }
}

export default function LegalScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [tab, setTab]               = useState<Tab>('terms')
  const [termsSections, setTerms]   = useState<Section[]>([])
  const [privacySections, setPrivacy] = useState<Section[]>([])
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-legal'],
    queryFn: async () => (await api.get('/api/admin/legal')).data as LegalData,
  })

  useEffect(() => {
    if (data) {
      setTerms(data.terms.sections.map((s) => ({ ...s })))
      setPrivacy(data.privacy.sections.map((s) => ({ ...s })))
      setHasUnsaved(false)
    }
  }, [data])

  const sections    = tab === 'terms' ? termsSections : privacySections
  const setSections = tab === 'terms' ? setTerms       : setPrivacy

  const updateSection = (i: number, field: 'title' | 'body', val: string) => {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
    setHasUnsaved(true)
  }

  const addSection = () => {
    setSections((prev) => [...prev, { title: '', body: '' }])
    setHasUnsaved(true)
  }

  const removeSection = (i: number) => {
    Alert.alert('Remove Section', 'Delete this section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setSections((prev) => prev.filter((_, idx) => idx !== i))
        setHasUnsaved(true)
      }},
    ])
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    setSections((prev) => {
      const arr = [...prev]
      ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
      return arr
    })
    setHasUnsaved(true)
  }

  const moveDown = (i: number) => {
    if (i === sections.length - 1) return
    setSections((prev) => {
      const arr = [...prev]
      ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      return arr
    })
    setHasUnsaved(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const toSave = tab === 'terms' ? termsSections : privacySections
      const blank = toSave.filter((s) => !s.title.trim() || !s.body.trim())
      if (blank.length > 0) {
        throw new Error(`${blank.length} section${blank.length > 1 ? 's are' : ' is'} missing a title or body. Fill them in or remove them before saving.`)
      }
      if (toSave.length === 0) throw new Error('No sections to save')
      await api.put('/api/admin/legal', { type: tab, sections: toSave })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal'] })
      queryClient.invalidateQueries({ queryKey: ['legal'] })
      setHasUnsaved(false)
      Alert.alert('Saved', `${tab === 'terms' ? 'Terms of Use' : 'Privacy Policy'} updated successfully.`)
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed to save.'),
  })

  const resetToDefault = useMutation({
    mutationFn: async () => {
      await api.post('/api/admin/legal/reset', { type: tab })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal'] })
      queryClient.invalidateQueries({ queryKey: ['legal'] })
      Alert.alert('Reset', `${tab === 'terms' ? 'Terms' : 'Privacy Policy'} reset to defaults.`)
    },
  })

  const confirmReset = () =>
    Alert.alert(
      'Reset to Defaults',
      `This will discard all custom content and restore the default ${tab === 'terms' ? 'Terms of Use' : 'Privacy Policy'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetToDefault.mutate() },
      ]
    )

  const currentData = tab === 'terms' ? data?.terms : data?.privacy

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>Terms & Privacy</Text>
        </View>
        <TouchableOpacity onPress={async () => { await deleteToken(); clearAuth(); router.replace('/(auth)/login') }} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tab selector */}
      <View style={s.tabRow}>
        {(['terms', 'privacy'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Meta info */}
          <View style={s.metaRow}>
            <View style={s.metaLeft}>
              {currentData?.isDefault
                ? <View style={s.defaultBadge}><Text style={s.defaultBadgeText}>Using default content</Text></View>
                : <Text style={s.updatedText}>
                    Last updated: {currentData?.updatedAt ? new Date(currentData.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </Text>
              }
            </View>
            <TouchableOpacity style={s.resetBtn} onPress={confirmReset} disabled={resetToDefault.isPending}>
              <Ionicons name="refresh-outline" size={14} color="#6B7280" />
              <Text style={s.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Sections */}
          {sections.map((section, i) => (
            <View key={i} style={s.sectionCard}>
              <View style={s.sectionCardHeader}>
                <Text style={s.sectionNum}>Section {i + 1}</Text>
                <View style={s.sectionActions}>
                  <TouchableOpacity onPress={() => moveUp(i)} disabled={i === 0} style={s.orderBtn}>
                    <Ionicons name="chevron-up" size={16} color={i === 0 ? '#D1D5DB' : '#6B7280'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveDown(i)} disabled={i === sections.length - 1} style={s.orderBtn}>
                    <Ionicons name="chevron-down" size={16} color={i === sections.length - 1 ? '#D1D5DB' : '#6B7280'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSection(i)} style={s.orderBtn}>
                    <Ionicons name="trash-outline" size={15} color={RED} />
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={s.titleInput}
                placeholder="Section title (e.g. 1. Acceptance)"
                placeholderTextColor="#9CA3AF"
                value={section.title}
                onChangeText={(v) => updateSection(i, 'title', v)}
              />
              <TextInput
                style={s.bodyInput}
                placeholder="Section content..."
                placeholderTextColor="#9CA3AF"
                value={section.body}
                onChangeText={(v) => updateSection(i, 'body', v)}
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}

          {/* Add section */}
          <TouchableOpacity style={s.addBtn} onPress={addSection}>
            <Ionicons name="add-circle-outline" size={20} color={NAVY} />
            <Text style={s.addBtnText}>Add Section</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, (!hasUnsaved || save.isPending) && s.saveBtnDim]}
            onPress={() => save.mutate()}
            disabled={!hasUnsaved || save.isPending}
          >
            {save.isPending
              ? <ActivityIndicator size="small" color={NAVY} />
              : <>
                  <Ionicons name="checkmark-outline" size={18} color={NAVY} />
                  <Text style={s.saveBtnText}>
                    {hasUnsaved ? 'Save Changes' : 'No unsaved changes'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: BG },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle:{ color: '#FFF', fontSize: 22, fontWeight: '700' },
  logoutBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },

  tabRow:        { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn:        { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabBtnActive:  { backgroundColor: NAVY },
  tabText:       { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#FFF', fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  metaRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  metaLeft:        { flex: 1 },
  defaultBadge:    { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  defaultBadgeText:{ fontSize: 12, color: '#D97706', fontWeight: '600' },
  updatedText:     { fontSize: 12, color: '#9CA3AF' },
  resetBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, flexShrink: 0 },
  resetBtnText:    { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  sectionCard:       { backgroundColor: CARD, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionNum:        { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  sectionActions:    { flexDirection: 'row', gap: 4 },
  orderBtn:          { padding: 6 },
  titleInput:        { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontWeight: '600', color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 8 },
  bodyInput:         { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#374151', backgroundColor: '#FAFAFA', minHeight: 80, maxHeight: 200, lineHeight: 20 },

  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderWidth: 1, borderColor: NAVY, borderRadius: 12, borderStyle: 'dashed' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: NAVY },

  saveBtn:    { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveBtnDim: { opacity: 0.5 },
  saveBtnText:{ fontSize: 15, fontWeight: '700', color: NAVY },
})
