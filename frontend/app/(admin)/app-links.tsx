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
import { NAVY, GOLD, BG, CARD } from '../../constants/colors'

type Settings = {
  iosAppUrl: string | null
  androidAppUrl: string | null
}

export default function AppLinksScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [iosUrl, setIosUrl] = useState('')
  const [androidUrl, setAndroidUrl] = useState('')
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/api/admin/settings')).data as Settings,
  })

  useEffect(() => {
    if (data) {
      setIosUrl(data.iosAppUrl ?? '')
      setAndroidUrl(data.androidAppUrl ?? '')
      setHasUnsaved(false)
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      await api.put('/api/admin/settings', {
        iosAppUrl: iosUrl.trim() || null,
        androidAppUrl: androidUrl.trim() || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setHasUnsaved(false)
      Alert.alert('Saved', 'App links updated successfully.')
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save.'),
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>App Links</Text>
        </View>
        <TouchableOpacity onPress={async () => { await deleteToken(); clearAuth(); router.replace('/(auth)/login') }} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.explainer}>
            These links are used by the "Share App" button in the student Profile screen —
            students on iOS get the iOS link, students on Android get the Android link.
            Leave a field blank if that store listing isn't live yet.
          </Text>

          <View style={s.card}>
            <View style={s.fieldRow}>
              <Ionicons name="logo-apple" size={18} color={NAVY} />
              <Text style={s.fieldLabel}>iOS App Store URL</Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="https://apps.apple.com/app/..."
              placeholderTextColor="#9CA3AF"
              value={iosUrl}
              onChangeText={(v) => { setIosUrl(v); setHasUnsaved(true) }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={s.card}>
            <View style={s.fieldRow}>
              <Ionicons name="logo-google-playstore" size={18} color={NAVY} />
              <Text style={s.fieldLabel}>Android Play Store URL</Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="https://play.google.com/store/apps/details?id=..."
              placeholderTextColor="#9CA3AF"
              value={androidUrl}
              onChangeText={(v) => { setAndroidUrl(v); setHasUnsaved(true) }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

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

  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  explainer: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 4 },

  card: { backgroundColor: CARD, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, gap: 10 },
  fieldRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  input:      { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1F2937', backgroundColor: '#FAFAFA' },

  saveBtn:    { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnDim: { opacity: 0.5 },
  saveBtnText:{ fontSize: 15, fontWeight: '700', color: NAVY },
})
