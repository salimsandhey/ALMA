import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { api } from '../../lib/api'
import { NAVY, TEAL, GOLD, WHITE, GREY } from '../../constants/colors'

const BG = '#F2F3F7'

const EMOJI_BG_COLORS = [
  '#DBEAFE',
  '#FCE7F3',
  '#DCFCE7',
  '#FEF9C3',
  '#F3E8FF',
  '#FFE4E6',
  '#FEF3C7',
  '#CCFBF1',
  '#E0E7FF',
  '#FEE2E2',
  '#D1FAE5',
]

const MODULE_EMOJIS = [
  '👤',
  '🍽️',
  '🐾',
  '👫',
  '🎨',
  '🏠',
  '🏃',
  '✈️',
  '🏨',
  '🍕',
  '🤝',
]

interface Module {
  id: string
  title: string
  orderIndex: number
  lessonCount: number
  completedLessons: number
  completionPercent: number
  isCompleted: boolean
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.cardRow}>
        <View style={styles.skeletonEmojiBox} />
        <View style={styles.skeletonTextCol}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonCount} />
        </View>
        <View style={styles.skeletonChevron} />
      </View>
    </Animated.View>
  )
}

function ModuleCard({ module, index, isLocked }: { module: Module; index: number; isLocked: boolean }) {
  const router = useRouter()
  const bgColor = EMOJI_BG_COLORS[index % EMOJI_BG_COLORS.length]
  const emoji = MODULE_EMOJIS[index % MODULE_EMOJIS.length]

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isLocked ? 1 : 0.75}
      onPress={() => {
        if (isLocked) return
        router.push({ pathname: '/module/[id]', params: { id: module.id } })
      }}
    >
      <View style={styles.cardRow}>
        <View style={[styles.emojiBox, isLocked ? styles.emojiBoxLocked : { backgroundColor: bgColor }]}>
          {isLocked
            ? <Text style={styles.lockIcon}>🔒</Text>
            : <Text style={styles.emojiText}>{emoji}</Text>
          }
        </View>

        <View style={styles.textCol}>
          <Text style={styles.moduleLabel}>
            MODULE {module.orderIndex}
          </Text>
          <Text style={[styles.moduleTitle, isLocked && styles.moduleTitleLocked]}>
            {module.title}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                isLocked
                  ? styles.progressFillLocked
                  : { width: `${Math.min(100, Math.max(0, module.completionPercent))}%` },
              ]}
            />
          </View>

          <Text style={[styles.lessonCount, isLocked && styles.lessonCountLocked]}>
            {isLocked ? 'Locked' : `${module.completedLessons}/${module.lessonCount}`}
          </Text>
        </View>

        {!isLocked && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  )
}

export default function Modules() {
  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/api/modules').then((r) => r.data),
  })

  const modules: Module[] = data?.modules ?? []

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Modules</Text>
        <Text style={styles.subtitle}>
          Build confidence lesson by lesson
        </Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          modules.map((module, index) => {
            const isLocked = false
            return <ModuleCard key={module.id} module={module} index={index} isLocked={isLocked} />
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: NAVY,
  },
  subtitle: {
    fontSize: 14,
    color: GREY,
    marginTop: 4,
    marginBottom: 24,
  },
  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  moduleLabel: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: NAVY,
  },
  lessonCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  chevron: {
    fontSize: 20,
    color: GREY,
    marginLeft: 8,
  },
  emojiBoxLocked: {
    backgroundColor: '#E5E7EB',
  },
  lockIcon: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  moduleTitleLocked: {
    color: '#9CA3AF',
  },
  progressFillLocked: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    width: '0%',
  },
  lessonCountLocked: {
    color: '#9CA3AF',
  },
  // Skeleton styles
  skeletonEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  skeletonTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonLabel: {
    width: 72,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  skeletonTitle: {
    width: '75%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginTop: 6,
  },
  skeletonBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 10,
  },
  skeletonCount: {
    width: 36,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  skeletonChevron: {
    width: 12,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginLeft: 8,
  },
})
