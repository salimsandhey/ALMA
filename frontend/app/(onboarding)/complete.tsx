import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { NAVY, GOLD, WHITE } from '../../constants/colors'

const badges = [
  {
    image: require('../../assets/onboarding/footprints.png'),
    label: 'First Steps',
  },
  {
    image: require('../../assets/onboarding/fire.png'),
    label: '1 Day Visit',
  },
  {
    image: require('../../assets/onboarding/star.png'),
    label: '10 ALMA Points',
  },
]

export default function OnboardingCompleteScreen() {
  const router = useRouter()

  const handleStartLearning = () => {
    router.replace('/intro-slides')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heroEmoji}>🎉</Text>
        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.subheading}>Welcome to the ALMA family</Text>
        <Text style={styles.tagline}>Your journey to English fluency starts now!</Text>

        <View style={styles.badgesRow}>
          {badges.map((badge) => (
            <View key={badge.label} style={styles.badgeBox}>
              <Image source={badge.image} style={styles.badgeImage} resizeMode="contain" />
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleStartLearning} activeOpacity={0.9}>
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
  badgesRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 36,
  },
  badgeBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
    minWidth: 90,
  },
  badgeImage: {
    width: 40,
    height: 40,
  },
  badgeLabel: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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
