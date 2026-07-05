import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { NAVY, GOLD, BG } from '../constants/colors'

type ScreenItem = {
  label: string
  route: string
  note?: string
}

type ScreenGroup = {
  title: string
  color: string
  screens: ScreenItem[]
}

const GROUPS: ScreenGroup[] = [
  {
    title: 'Auth',
    color: '#7C3AED',
    screens: [
      { label: 'Login', route: '/(auth)/login' },
      { label: 'Register', route: '/(auth)/register' },
      { label: 'Verify OTP', route: '/(auth)/verify-otp' },
      { label: 'Reset Password', route: '/(auth)/reset-password' },
    ],
  },
  {
    title: 'Onboarding',
    color: '#0891B2',
    screens: [
      { label: 'Intro Slides', route: '/intro-slides' },
      { label: 'Name', route: '/(onboarding)/name' },
      { label: 'Country', route: '/(onboarding)/country' },
      { label: 'Language', route: '/(onboarding)/language' },
      { label: 'Demographics', route: '/(onboarding)/demographics' },
      { label: 'Onboarding Complete', route: '/(onboarding)/complete' },
    ],
  },
  {
    title: 'Student',
    color: '#059669',
    screens: [
      { label: 'Home', route: '/(student)/home' },
      { label: 'Modules', route: '/(student)/modules' },
      { label: 'Music', route: '/(student)/music' },
      { label: 'Profile', route: '/(student)/profile' },
      { label: 'Entertainment', route: '/(student)/explore' },
    ],
  },
  {
    title: 'Dynamic (sample IDs)',
    color: '#D97706',
    screens: [
      { label: 'Module Detail', route: '/module/1', note: 'id=1' },
      { label: 'Lesson', route: '/lesson/1', note: 'id=1' },
      { label: 'Lesson Complete', route: '/lesson/complete' },
      { label: 'Music Detail', route: '/music/1', note: 'id=1' },
      { label: 'Karaoke', route: '/music/karaoke/1', note: 'id=1' },
      { label: 'Music Results', route: '/music/results/1', note: 'id=1' },
    ],
  },
]

export default function DevScreens() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>All Screens</Text>
        <Text style={styles.subheading}>Dev navigator — tap any screen to open it</Text>

        {GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <View style={[styles.groupHeader, { backgroundColor: group.color }]}>
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            {group.screens.map((screen) => (
              <TouchableOpacity
                key={screen.route}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => router.push(screen.route as any)}
              >
                <Text style={styles.rowLabel}>{screen.label}</Text>
                <View style={styles.rowRight}>
                  {screen.note ? <Text style={styles.rowNote}>{screen.note}</Text> : null}
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: NAVY },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  group: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  groupHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  groupTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowNote: { fontSize: 11, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  arrow: { fontSize: 20, color: GOLD, fontWeight: '600' },
})
