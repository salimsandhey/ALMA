import React, { useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Share, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { deleteToken } from '../../lib/storage'
import { useAuthStore } from '../../stores/authStore'
import { useVoiceStore, VoiceGender } from '../../stores/voiceStore'
import { api } from '../../lib/api'

const NAVY = '#093373'
const NAVY_DARK = '#072868'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const GREY = '#6B7280'

// Hex geometry: flat-top, circumradius R
const R = 28
const HEX_W = R * 2          // 56px total width
const HEX_H = Math.round(R * Math.sqrt(3))  // 48px total height
const TRI_W = Math.round(R / 2)             // 14px triangle width
const RECT_W = R              // 28px center rect width
const TRI_H = Math.round(HEX_H / 2)        // 24px half-height

function getLevel(xp: number): string {
  if (xp >= 1000) return 'Advanced'
  if (xp >= 500) return 'Intermediate'
  if (xp >= 100) return 'Elementary'
  return 'Beginner'
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function genderLabel(g: string | null | undefined): string {
  if (g === 'MALE') return 'Male'
  if (g === 'FEMALE') return 'Female'
  if (g === 'OTHER') return 'Other'
  return ''
}

type ProfileData = {
  displayName: string
  email: string
  avatarUrl: string | null
  age: number | null
  gender: string | null
  nativeLanguage: string | null
  country: string | null
  xpTotal: number
  streakCount: number
}

type Language = { code: string; label: string; flag: string }

export default function Profile() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { voiceGender, setVoiceGender } = useVoiceStore()

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/users/me').then((r) => r.data),
  })

  const { data: languagesData } = useQuery<{ languages: Language[] }>({
    queryKey: ['languages'],
    queryFn: () => api.get('/api/languages').then((r) => r.data),
  })

  const { data: modulesData } = useQuery<{ modules: Array<{ completed: boolean }> }>({
    queryKey: ['modules-progress'],
    queryFn: () => api.get('/api/modules').then((r) => r.data),
  })

  const donePercent = modulesData?.modules?.length
    ? Math.round((modulesData.modules.filter((m: any) => m.completed).length / modulesData.modules.length) * 100)
    : 0

  const displayName = profile?.displayName ?? user?.displayName ?? ''
  const xp = profile?.xpTotal ?? user?.xpTotal ?? 0
  const streak = profile?.streakCount ?? user?.streakCount ?? 0
  const level = getLevel(xp)
  const initials = getInitials(displayName)

  // Resolve language → show flag once as part of language label
  const langObj = languagesData?.languages?.find((l) => l.code === profile?.nativeLanguage)
  const langDisplay = langObj
    ? `${langObj.flag} ${langObj.label}`
    : profile?.nativeLanguage ?? null

  const metaParts: string[] = [
    profile?.age ? `${profile.age} yrs` : null,
    genderLabel(profile?.gender) || null,
    langDisplay,
  ].filter(Boolean) as string[]

  const handleLogout = async () => {
    await deleteToken()
    useAuthStore.getState().clearAuth()
    router.replace('/(auth)/login')
  }

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        title: 'ALMA English App',
        message: 'Learn hospitality English with ALMA! Download the app at alma-english-app.com',
      })
    } catch { /* cancelled */ }
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Avatar */}
          <View style={styles.avatarRing}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{displayName}</Text>

          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>{level}</Text>
          </View>

          {/* Meta: 27 yrs  Male  🇫🇷 Français */}
          <View style={styles.metaRow}>
            {metaParts.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={styles.metaDot}>  </Text>}
                <Text style={styles.metaText}>{item}</Text>
              </React.Fragment>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatBox icon="star" value={String(xp)} label="XP" />
            <StatBox icon="flame" value={String(streak)} label="Streak" />
            <StatBox icon="checkmark-circle-outline" value={`${donePercent}%`} label="Done" />
          </View>
        </View>

        {/* ── Profile Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <View style={styles.card}>
            <MenuItem icon="pencil-outline" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
            <View style={styles.divider} />
            <MenuItem icon="ribbon-outline" label="Badges" onPress={() => router.push('/badges')} />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="phone-portrait-outline" size={17} color={NAVY} />
                </View>
                <Text style={styles.menuLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E7EB', true: NAVY }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="mic-outline" size={17} color={NAVY} />
                </View>
                <Text style={styles.menuLabel}>Voice</Text>
              </View>
              <View style={styles.voiceChips}>
                {(['female', 'male'] as VoiceGender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.voiceChip, voiceGender === g && styles.voiceChipActive]}
                    onPress={() => setVoiceGender(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.voiceChipText, voiceGender === g && styles.voiceChipTextActive]}>
                      {g === 'female' ? 'Female' : 'Male'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem icon="book-outline" label="How to Use ALMA" onPress={() => router.push('/how-to-use')} />
            <View style={styles.divider} />
            <MenuItem icon="chatbox-outline" label="Share Feedback" onPress={() => router.push('/feedback')} />
            <View style={styles.divider} />
            <MenuItem icon="share-social-outline" label="Share App" onPress={handleShareApp} />
            <View style={styles.divider} />
            <MenuItem icon="shield-outline" label="Terms & Privacy" onPress={() => router.push('/terms-privacy')} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Flat-top hexagon stat box ─────────────────────────────────────────────────

function StatBox({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      {/* Flat-top hexagon: left triangle + center rect + right triangle */}
      <View style={{ width: HEX_W, height: HEX_H, alignItems: 'center', justifyContent: 'center' }}>
        {/* Left-pointing triangle (tip at left) */}
        <View style={{
          position: 'absolute', left: 0,
          width: 0, height: 0,
          borderStyle: 'solid',
          borderRightWidth: TRI_W,
          borderTopWidth: TRI_H,
          borderBottomWidth: TRI_H,
          borderRightColor: 'rgba(255,255,255,0.13)',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }} />
        {/* Center rectangle */}
        <View style={{
          position: 'absolute',
          left: TRI_W,
          width: RECT_W,
          height: HEX_H,
          backgroundColor: 'rgba(255,255,255,0.13)',
        }} />
        {/* Right-pointing triangle (tip at right) */}
        <View style={{
          position: 'absolute', right: 0,
          width: 0, height: 0,
          borderStyle: 'solid',
          borderLeftWidth: TRI_W,
          borderTopWidth: TRI_H,
          borderBottomWidth: TRI_H,
          borderLeftColor: 'rgba(255,255,255,0.13)',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }} />
        {/* Icon centered on top of hex */}
        <Ionicons name={icon} size={22} color={GOLD} style={{ zIndex: 1 }} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ── Menu item ─────────────────────────────────────────────────────────────────

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Ionicons name={icon} size={17} color={NAVY} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#C7CBCF" />
    </TouchableOpacity>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  pageTitle: {
    fontSize: 24, fontWeight: '800', color: '#111827',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },

  // Hero card
  heroCard: {
    marginHorizontal: 16, borderRadius: 20, backgroundColor: NAVY,
    alignItems: 'center', paddingTop: 28, paddingBottom: 28,
    paddingHorizontal: 20, overflow: 'hidden', marginBottom: 20,
  },
  decorCircle1: {
    position: 'absolute', right: -40, top: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle2: {
    position: 'absolute', right: 14, top: 14,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  avatarRing: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden', marginBottom: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },

  heroName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },

  levelPill: {
    backgroundColor: GOLD, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4, marginBottom: 10,
  },
  levelPillText: { color: NAVY, fontSize: 12, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: 24,
  },
  metaText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  metaDot: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  statBox: { alignItems: 'center', gap: 6, minWidth: HEX_W },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 14 },
  sectionTitle: { color: NAVY, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: '#111827', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 60 },

  voiceChips: { flexDirection: 'row', gap: 8 },
  voiceChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  voiceChipActive: { borderColor: NAVY, backgroundColor: NAVY },
  voiceChipText: { fontSize: 13, fontWeight: '600', color: GREY },
  voiceChipTextActive: { color: '#FFFFFF' },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#E53935',
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
})
