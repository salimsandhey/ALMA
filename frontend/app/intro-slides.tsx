import React, { useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../stores/authStore'
import { NAVY, GOLD, WHITE } from '../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Slide {
  id: string
  emoji: string
  title: string
  subtitle: string
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '👋',
    title: "Hey, I'm ALMA",
    subtitle: 'Your personal English coach built for the hospitality industry. I\'m here to help you speak with confidence.',
  },
  {
    id: '2',
    emoji: '🎮',
    title: 'English can actually be fun',
    subtitle: 'Bite-sized games, voice challenges, and real dialogues — learning that feels like play, not homework.',
  },
  {
    id: '3',
    emoji: '🏨',
    title: 'English you\'ll use at work',
    subtitle: 'From hotel check-ins to restaurant orders — every lesson teaches phrases you\'ll use with real guests.',
  },
]

export default function IntroSlidesScreen() {
  const { token } = useAuthStore()
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Redirect to auth if not logged in — useEffect is reliable after navigation is ready
  useEffect(() => {
    if (!token) {
      router.replace('/(auth)')
    }
  }, [token])

  // Render nothing while the redirect is in progress
  if (!token) return null

  const handleFinish = () => {
    router.replace('/(student)/home')
  }

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true })
    } else {
      handleFinish()
    }
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0)
    }
  }).current

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <Text style={styles.slideEmoji}>{item.emoji}</Text>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  )

  const isLast = activeIndex === SLIDES.length - 1

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          style={styles.flatList}
        />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.ctaText}>{isLast ? "Let's Go! 🚀" : 'Next'}</Text>
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
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: 32,
  },
  slideTitle: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slideSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: GOLD,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ctaBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 18,
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaText: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '800',
  },
})
