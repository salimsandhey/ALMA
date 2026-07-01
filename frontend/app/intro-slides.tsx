import React, { useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Audio } from 'expo-av'
import { useAuthStore } from '../stores/authStore'
import { useVoiceStore } from '../stores/voiceStore'
import { api } from '../lib/api'

const { width: W, height: H } = Dimensions.get('window')

const GOLD = '#F5C518'
const BG   = '#093373'
const CIRCLE_SIZE   = W * 0.65
const ILLUS_SIZE    = W * 0.80

const SLIDES = [
  {
    id: '1',
    image: require('../assets/onboarding/slide-1.png'),
    title: "Hey, I'm ALMA —\nyour English buddy!",
    subtitle:
      "Think of me as a friend who helps you speak English better. Chat with me anytime, and I'll gently help you sound more natural — no pressure, no judgment!",
  },
  {
    id: '2',
    image: require('../assets/onboarding/slide-2.png'),
    title: 'Learning English\ncan actually be fun',
    subtitle:
      "Earn ALMA Points, collect badges, and challenge yourself with games that feel more like play than study. The more you do, the better you get — it's that simple!",
  },
  {
    id: '3',
    image: require('../assets/onboarding/slide-3.png'),
    title: "English you'll\nactually use at work",
    subtitle:
      "From welcoming hotel guests to taking a restaurant order — every lesson is built around real situations you'll face in tourism. Let's get you ready!",
  },
]

export default function IntroSlidesScreen() {
  const { token } = useAuthStore()
  const voiceGender = useVoiceStore((s) => s.voiceGender)
  const router    = useRouter()
  const listRef   = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!token) router.replace('/(auth)')
  }, [token])

  const currentSound = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    return () => {
      currentSound.current?.stopAsync().catch(() => {})
      currentSound.current?.unloadAsync().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const slide = SLIDES[activeIndex]
    if (!slide) return
    let cancelled = false

    const play = async () => {
      if (currentSound.current) {
        await currentSound.current.stopAsync().catch(() => {})
        await currentSound.current.unloadAsync().catch(() => {})
        currentSound.current = null
      }
      if (cancelled) return
      try {
        const text = `${slide.title.replace(/\n/g, ' ')}. ${slide.subtitle}`
        const { data } = await api.post('/api/tts', { text, gender: voiceGender })
        if (cancelled) return
        const { sound } = await Audio.Sound.createAsync({ uri: data.audioUrl })
        if (cancelled) { sound.unloadAsync(); return }
        currentSound.current = sound
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {})
            currentSound.current = null
          }
        })
        await sound.playAsync()
      } catch {}
    }

    play()
    return () => { cancelled = true }
  }, [activeIndex, voiceGender])

  if (!token) return null

  const isFirst = activeIndex === 0
  const isLast  = activeIndex === SLIDES.length - 1

  const goTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true })
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0)
  }).current

  const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={styles.slide}>
      {/* Circle background behind image — image overflows */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageCircle} />
        <Image source={item.image} style={styles.illustration} resizeMode="contain" />
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Decorative circles — top-right and bottom-left */}
      <View style={styles.circleRight} />
      <View style={styles.circleLeft} />

      {/* Swipeable slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={{ flex: 1 }}
        bounces={false}
        decelerationRate="fast"
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

      {/* Buttons */}
      <View style={[styles.btnRow, isFirst && styles.btnRowSingle]}>
        {!isFirst && (
          <TouchableOpacity onPress={() => goTo(activeIndex - 1)} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => isLast ? router.replace('/(student)/home') : goTo(activeIndex + 1)}
          style={[styles.nextBtn, isFirst && styles.nextBtnFull]}
          activeOpacity={0.9}
        >
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Corner decorations ── */
  circleRight: {
    position: 'absolute',
    width:  W * 0.65,
    height: W * 0.65,
    borderRadius: W * 0.35,
    backgroundColor: '#1A52C4',
    top:   -W * 0.30,
    right: -W * 0.300,
    opacity: 0.45,
  },
  circleLeft: {
    position: 'absolute',
    width:  W * 0.55,
    height: W * 0.55,
    borderRadius: W * 0.275,
    backgroundColor: '#1A52C4',
    bottom: -W * 0.25,
    left:   -W * 0.25,
    opacity: 0.35,
  },

  /* ── Slide ── */
  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
  },

  /* ── Illustration ── */
  imageWrapper: {
    width: ILLUS_SIZE,
    height: ILLUS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  imageCircle: {
    position: 'absolute',
    width:  CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  illustration: {
    width:  ILLUS_SIZE,
    height: ILLUS_SIZE,
  },

  /* ── Text ── */
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* ── Dots ── */
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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

  /* ── Buttons ── */
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  btnRowSingle: {
    justifyContent: 'center',
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  backText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  nextBtnFull: {
    flex: 1,
    paddingHorizontal: 0,
  },
  nextText: {
    color: BG,
    fontSize: 16,
    fontWeight: '800',
  },
})
