import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const GREY = '#6B7280'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '🏠',
    title: 'Home Dashboard',
    body: 'Your home screen shows your streak, XP points, and overall progress. Tap the AI Coach card to start a conversation or hit Continue Learning to pick up where you left off.',
  },
  {
    emoji: '📚',
    title: 'Modules',
    body: 'Browse all 11 hospitality modules. Each module contains flashcards, word-match games, fill-in-the-blank exercises, quizzes and dialogues. Complete them in order to unlock new content.',
  },
  {
    emoji: '🤖',
    title: 'AI English Coach',
    body: 'Chat or speak with your personal AI coach. It will have a natural conversation with you, correct your grammar gently, and give pronunciation tips in real time.',
  },
  {
    emoji: '🎤',
    title: 'Voice Activities',
    body: 'Most lessons use your microphone. Tap the mic button, say the word clearly, and you\'ll get instant feedback on accuracy. Make sure your device permissions allow microphone access.',
  },
  {
    emoji: '🏆',
    title: 'XP & Badges',
    body: 'Earn XP after every lesson based on your score. Collect badges for streaks, perfect scores, and completing modules. Check the Leaderboard to see where you rank!',
  },
  {
    emoji: '🌍',
    title: 'Explore',
    body: 'The Explore tab has curated videos, articles, and songs to practise English outside of lessons. Tap any item to open it in your browser.',
  },
  {
    emoji: '🔥',
    title: 'Daily Streak',
    body: 'Log in every day to keep your streak alive. Your streak resets if you miss a day, so try to do at least one lesson daily to stay on track!',
  },
]

export default function HowToUse() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const goTo = (index: number) => {
    setCurrent(index)
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
  }

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1)
    } else {
      router.back()
    }
  }

  const handleBack = () => {
    if (current > 0) goTo(current - 1)
  }

  const progressWidth = ((current + 1) / SLIDES.length) * 100

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Use ALMA</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressWidth}%` as any }]} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        {current > 0 ? (
          <TouchableOpacity style={styles.backNavBtn} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={16} color={NAVY} />
            <Text style={styles.backNavBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {current === SLIDES.length - 1 ? 'Done' : 'Next'}
          </Text>
          {current < SLIDES.length - 1 && (
            <Ionicons name="chevron-forward" size={16} color={NAVY} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  progressBarBg: { height: 4, backgroundColor: '#E5E7EB' },
  progressBarFill: { height: 4, backgroundColor: GOLD },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 20,
  },
  slideEmoji: { fontSize: 80 },
  slideTitle: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  slideBody: { fontSize: 15, color: GREY, textAlign: 'center', lineHeight: 24 },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, paddingVertical: 16,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB',
  },
  dotActive: { width: 20, backgroundColor: NAVY },
  btnRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 24, gap: 12,
  },
  backNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16,
    paddingVertical: 15, backgroundColor: '#FFFFFF',
  },
  backNavBtnText: { fontSize: 15, fontWeight: '600', color: NAVY },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },
})
