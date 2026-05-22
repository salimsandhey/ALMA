import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'

const NAVY = '#0B1F4B'
const TEAL = '#0D9488'
const GOLD = '#F5A623'
const BG = '#F2F3F7'
const WHITE = '#FFFFFF'
const GREY = '#6B7280'

function BadgePill({ name }: { name: string }) {
  const scale = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start()
  }, [])
  return (
    <Animated.View style={[styles.badgePill, { transform: [{ scale }] }]}>
      <Text style={styles.badgePillText}>🏆 {name}</Text>
    </Animated.View>
  )
}

export default function LessonCompleteScreen() {
  const router = useRouter()
  const { xpEarned, moduleId, score, nextLessonId, badges } = useLocalSearchParams<{
    xpEarned: string
    moduleId: string
    score: string
    nextLessonId: string
    badges: string
  }>()
  const badgeList = badges ? badges.split(',').filter(Boolean) : []

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.heading}>Lesson Complete!</Text>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}%</Text>
          <Text style={styles.xpValue}>+{xpEarned} XP</Text>
        </View>

        {/* Badge section */}
        {badgeList.length > 0 && (
          <View style={styles.badgeSection}>
            <Text style={styles.badgeHeading}>🏅 Badge{badgeList.length > 1 ? 's' : ''} Unlocked!</Text>
            {badgeList.map((badge, i) => (
              <BadgePill key={i} name={badge} />
            ))}
          </View>
        )}

        {/* Back to Module button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            router.replace({ pathname: '/module/[id]', params: { id: moduleId } })
          }
        >
          <Text style={styles.backBtnText}>Back to Module</Text>
        </TouchableOpacity>

        {/* Next Lesson button — only if nextLessonId is truthy */}
        {!!nextLessonId && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() =>
              router.replace({ pathname: '/lesson/[id]', params: { id: nextLessonId } })
            }
          >
            <Text style={styles.nextBtnText}>Next Lesson →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginTop: 60,
    textAlign: 'center',
  },
  heading: {
    color: NAVY,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    width: '100%',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  scoreLabel: {
    color: GREY,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: TEAL,
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  xpValue: {
    color: GOLD,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  backBtn: {
    marginTop: 32,
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 14,
    width: '100%',
  },
  backBtnText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  nextBtn: {
    marginTop: 12,
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 14,
    width: '100%',
  },
  nextBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  badgeSection: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  badgeHeading: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: GOLD,
    width: '100%',
    alignItems: 'center',
  },
  badgePillText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700',
  },
})
