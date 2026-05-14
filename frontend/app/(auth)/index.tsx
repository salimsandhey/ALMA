import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  ViewToken,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SW } = Dimensions.get('window')

const WHITE   = '#FFFFFF'
const GOLD_BTN = '#F5A623'


// circle-lb goes top-right, circle-rt goes bottom-left
const CIRCLE_RT_W = SW * 0.50
const CIRCLE_RT_H = CIRCLE_RT_W * (424 / 513)   // circle-lb.png is 513×424
const CIRCLE_LB_W = SW * 0.46
const CIRCLE_LB_H = CIRCLE_LB_W * (345 / 488)   // circle-rt.png is 488×345

const ILLUS_CIRCLE_SIZE = SW * 0.70
const ILLUS_SIZE        = SW * 0.78

type GradientColors = [string, string]

type Slide = {
  id: string
  gradient: GradientColors
  gradientStart: { x: number; y: number }
  gradientEnd: { x: number; y: number }
  title: string
  subtitle: string
  titleColor: string
  bodyColor: string
  skipColor: string
  dotActive: string
  dotInactive: string
  backColor: string
}

// CSS 135deg  → top-left to bottom-right → start{0,0} end{1,1}
// CSS 171.06deg → nearly straight down, slight left lean
const SLIDES: Slide[] = [
  {
    id: '1',
    gradient: ['#093373', '#0A4A9E'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    title: "Hey, I'm ALMA —\nyour English buddy!",
    subtitle:
      "Think of me as a friend who helps you speak English better. Chat with me anytime, and I'll gently help you sound more natural — no pressure, no judgment!",
    titleColor: WHITE,
    bodyColor: 'rgba(255,255,255,0.82)',
    skipColor: WHITE,
    dotActive: WHITE,
    dotInactive: 'rgba(255,255,255,0.35)',
    backColor: WHITE,
  },
  {
    id: '2',
    gradient: ['#CD9D18', '#BE921A'],
    gradientStart: { x: 0.52, y: 0 },
    gradientEnd: { x: 0.48, y: 1 },
    title: 'Learning English\ncan actually be fun',
    subtitle:
      "Earn XP, collect badges, and challenge yourself with games that feel more like play than study. The more you do, the better you get — it's that simple!",
    titleColor: WHITE,
    bodyColor: 'rgba(255,255,255,0.85)',
    skipColor: WHITE,
    dotActive: WHITE,
    dotInactive: 'rgba(255,255,255,0.4)',
    backColor: WHITE,
  },
  {
    id: '3',
    gradient: ['#093373', '#0A4A9E'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    title: "English you'll\nactually use at work",
    subtitle:
      "From welcoming hotel guests to taking a restaurant order — every lesson is built around real situations you'll face in tourism. Let's get you ready!",
    titleColor: WHITE,
    bodyColor: 'rgba(255,255,255,0.82)',
    skipColor: WHITE,
    dotActive: WHITE,
    dotInactive: 'rgba(255,255,255,0.35)',
    backColor: WHITE,
  },
]

const illustrations = [
  require('../../assets/onboarding/slider-1.png'),
  require('../../assets/onboarding/slider-2.png'),
  require('../../assets/onboarding/slider-3.png'),
]

export default function IntroSlides() {
  const router = useRouter()
  const flatListRef = useRef<FlatList<Slide>>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToLogin = () => router.replace('/(auth)/login')

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      goToLogin()
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })
    }
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index)
      }
    }
  ).current

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const renderItem = ({ item, index }: { item: Slide; index: number }) => (
    <LinearGradient
      colors={item.gradient}
      start={item.gradientStart}
      end={item.gradientEnd}
      style={styles.slide}
    >
      {/* Top-right corner arc */}
      <Image
        source={require('../../assets/onboarding/circle-lb.png')}
        style={styles.circleRT}
        resizeMode="stretch"
      />

      {/* Illustration: backdrop circle + illustration */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={require('../../assets/onboarding/circle-full.png')}
          style={styles.circleFull}
          resizeMode="contain"
        />
        <Image
          source={illustrations[index]}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: item.titleColor }]}>{item.title}</Text>
        <Text style={[styles.body, { color: item.bodyColor }]}>{item.subtitle}</Text>
      </View>

      {/* Bottom-left corner arc */}
      <Image
        source={require('../../assets/onboarding/circle-rt.png')}
        style={styles.circleLB}
        resizeMode="stretch"
      />
    </LinearGradient>
  )

  const slide = SLIDES[currentIndex]
  const isFirst = currentIndex === 0
  const isLast  = currentIndex === SLIDES.length - 1

  return (
    <LinearGradient
      colors={slide.gradient}
      start={slide.gradientStart}
      end={slide.gradientEnd}
      style={styles.root}
    >
      <StatusBar style={currentIndex === 1 ? 'dark' : 'light'} />

      {/* Skip — fixed top-right */}
      <SafeAreaView style={styles.skipSafe} edges={['top']}>
        <TouchableOpacity onPress={goToLogin} style={styles.skipHit} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: slide.skipColor }]}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Swipeable slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      {/* Bottom controls — fixed overlay */}
      <SafeAreaView style={styles.bottomSafe} edges={['bottom']}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 22 : 8,
                  backgroundColor: i === currentIndex ? slide.dotActive : slide.dotInactive,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonsRow}>
          {isFirst ? (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, styles.nextBtnFull]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={handleBack} style={styles.backHit} activeOpacity={0.7}>
                <Text style={[styles.backText, { color: slide.backColor }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  skipSafe: { position: 'absolute', top: 0, right: 0, zIndex: 10 },
  skipHit: { paddingTop: 8, paddingRight: 20, paddingBottom: 12, paddingLeft: 24 },
  skipText: { fontSize: 16, fontWeight: '500' },

  flatList: { flex: 1 },

  slide: {
    width: SW,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 170,
    overflow: 'hidden',
  },

  circleRT: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CIRCLE_RT_W,
    height: CIRCLE_RT_H,
  },
  circleLB: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CIRCLE_LB_W,
    height: CIRCLE_LB_H,
  },

  illustrationWrapper: {
    width: ILLUS_SIZE,
    height: ILLUS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  circleFull: {
    position: 'absolute',
    width: ILLUS_CIRCLE_SIZE,
    height: ILLUS_CIRCLE_SIZE,
  },
  illustration: {
    width: ILLUS_SIZE,
    height: ILLUS_SIZE,
  },

  textBlock: { alignItems: 'center', paddingHorizontal: 28, gap: 12 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 23 },

  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: { height: 8, borderRadius: 4 },

  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backHit: { paddingVertical: 14, paddingRight: 16 },
  backText: { fontSize: 16, fontWeight: '500' },

  nextBtn: {
    backgroundColor: GOLD_BTN,
    borderRadius: 32,
    paddingVertical: 17,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nextBtnFull: { flex: 1 },
  nextBtnText: { color: WHITE, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
})
