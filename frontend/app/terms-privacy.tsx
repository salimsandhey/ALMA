import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const GREY = '#6B7280'

type Section = { title: string; body: string }

const FALLBACK_TERMS: Section[] = [
  { title: '1. Acceptance', body: 'By using ALMA you agree to these Terms. If you do not agree, please stop using the app.' },
  { title: '2. Who can use ALMA', body: 'ALMA is intended for students and trainers involved in hospitality education programmes. Users must be at least 13 years of age.' },
  { title: '3. Your Account', body: 'You are responsible for keeping your login credentials secure. Do not share your account with others.' },
  { title: '4. Acceptable Use', body: 'Do not misuse ALMA. This includes no harmful, abusive, or illegal content. Violations may result in account suspension.' },
  { title: '5. Intellectual Property', body: 'All ALMA content, modules, and AI responses are owned by or licensed to the ALMA platform. You may not copy or redistribute them.' },
  { title: '6. Disclaimers', body: 'ALMA is an educational tool. We do not guarantee employment outcomes. Content is provided as-is.' },
  { title: '7. Changes', body: 'We may update these terms. Continued use after changes means you accept the new terms.' },
]

const FALLBACK_PRIVACY: Section[] = [
  { title: 'What we collect', body: 'We collect your name, email, age, gender, native language, and learning progress to personalise your experience.' },
  { title: 'How we use it', body: 'Your data is used solely to deliver and improve ALMA. We do not sell your data to third parties.' },
  { title: 'Data storage', body: 'Data is stored securely using industry-standard infrastructure with standard encryption practices.' },
  { title: 'Voice data', body: 'Speech recognition is processed locally on your device. We do not store audio recordings.' },
  { title: 'Your rights', body: 'You can request deletion of your account and data at any time via the Edit Profile page.' },
  { title: 'Cookies', body: 'We use minimal session cookies required for authentication only.' },
  { title: 'Contact', body: "For privacy concerns, contact your programme administrator or reach out via the app's feedback form." },
]

export default function TermsPrivacy() {
  const router = useRouter()
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms')

  const { data, isLoading } = useQuery({
    queryKey: ['legal'],
    queryFn: async () => {
      const res = await api.get('/api/legal')
      return res.data as {
        terms:   { sections: Section[]; updatedAt: string | null }
        privacy: { sections: Section[]; updatedAt: string | null }
      }
    },
    staleTime: 10 * 60 * 1000,
  })

  const sections  = tab === 'terms'
    ? (data?.terms.sections   ?? FALLBACK_TERMS)
    : (data?.privacy.sections ?? FALLBACK_PRIVACY)

  const updatedAt = tab === 'terms' ? data?.terms.updatedAt : data?.privacy.updatedAt
  const heading   = tab === 'terms' ? 'Terms of Use' : 'Privacy Policy'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, tab === 'terms' && styles.tabActive]} onPress={() => setTab('terms')} activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>Terms of Use</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'privacy' && styles.tabActive]} onPress={() => setTab('privacy')} activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageHeading}>{heading}</Text>

          {sections.map((s, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.body}</Text>
            </View>
          ))}

          <Text style={styles.lastUpdated}>
            {updatedAt
              ? `Last updated: ${new Date(updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`
              : 'Last updated: March 2026'
            }
          </Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  tabsRow: { flexDirection: 'row', backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabActive: { backgroundColor: GOLD },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: NAVY },
  body: { padding: 16, gap: 10 },
  pageHeading: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
  cardBody: { fontSize: 13, color: '#374151', lineHeight: 20 },
  lastUpdated: { fontSize: 12, color: GREY, textAlign: 'center', marginTop: 8 },
})
