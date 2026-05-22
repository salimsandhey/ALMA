import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const WHITE = '#FFFFFF'

export default function OnboardingCompleteScreen() {
  const router = useRouter()

  const handleStartLearning = () => {
    // First time completing onboarding — always show intro slides
    router.replace('/intro-slides')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heroEmoji}>🎉</Text>
        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.subheading}>Welcome to the ALMA family</Text>
        <Text style={styles.tagline}>Your journey to English fluency starts now!</Text>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👣</Text>
              <Text style={styles.statLabel}>First Steps</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statLabel}>1 Day Streak</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statLabel}>10 XP</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartLearning}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Start Learning!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAVY,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heading: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheading: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  tagline: {
    color: GOLD,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 32,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 18,
    width: '85%',
    alignItems: 'center',
    marginTop: 40,
  },
  ctaText: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '800',
  },
})
