import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const CARD = '#FFFFFF'

const SECTIONS = [
  {
    key: 'modules',
    title: 'Modules',
    subtitle: 'Create and manage learning modules & lessons',
    icon: 'book-outline' as const,
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    key: 'challenges',
    title: 'Daily Challenges',
    subtitle: 'Manage speaking challenges students do each day',
    icon: 'trophy-outline' as const,
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    key: 'songs',
    title: 'Songs / Karaoke',
    subtitle: 'Add songs and lyrics for karaoke practice',
    icon: 'musical-notes-outline' as const,
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  {
    key: 'ai-usage',
    title: 'AI Token Monitor',
    subtitle: 'Track Gemini token usage and estimated cost',
    icon: 'flash-outline' as const,
    color: '#0891B2',
    bg: '#ECFEFF',
  },
  {
    key: 'legal',
    title: 'Terms & Privacy',
    subtitle: 'Edit Terms of Use and Privacy Policy content',
    icon: 'document-text-outline' as const,
    color: '#059669',
    bg: '#ECFDF5',
  },
]

export default function MoreScreen() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()

  const handleLogout = async () => {
    await deleteToken()
    clearAuth()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>More</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionLabel}>MANAGEMENT</Text>

        {SECTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={s.card}
            onPress={() => router.push(`/(admin)/${item.key}` as any)}
            activeOpacity={0.8}
          >
            <View style={[s.iconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardSub}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>ACCOUNT</Text>
        <TouchableOpacity style={[s.card, s.logoutCard]} onPress={handleLogout} activeOpacity={0.8}>
          <View style={[s.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </View>
          <View style={s.cardText}>
            <Text style={[s.cardTitle, { color: '#EF4444' }]}>Sign Out</Text>
            <Text style={s.cardSub}>Log out of the admin panel</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: BG },
  header:     { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle:{ color: '#FFF', fontSize: 24, fontWeight: '700' },
  logoutBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },
  scroll:     { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.6, marginBottom: 10 },
  card: {
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
  },
  logoutCard: { borderWidth: 1, borderColor: '#FEE2E2' },
  iconWrap:   { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardText:   { flex: 1 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  cardSub:    { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
})
