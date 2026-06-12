import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import BottomNavBar from '../../components/BottomNavBar'
import { NAVY, TEAL, GOLD, BG, WHITE, GREY } from '../../constants/colors'

type GameType =
  | 'FLASHCARD'
  | 'WORD_MATCH'
  | 'FILL_BLANK'
  | 'TRUE_FALSE'
  | 'DIALOGUE'
  | 'IMAGE_SPEAK'

interface Lesson {
  id: string
  title: string
  gameType: GameType
  isCompleted: boolean
  orderIndex: number
}

interface ModuleDetail {
  id: string
  title: string
  description: string
  emoji: string
  completedLessons: number
  lessonCount: number
  completionPercent: number
  lessons: Lesson[]
}

const GAME_TYPE_CONFIG: Record<GameType, { emoji: string; bg: string; label: string }> = {
  FLASHCARD:   { emoji: '📖', bg: '#DBEAFE', label: 'Flashcard' },
  WORD_MATCH:  { emoji: '🔗', bg: '#FCE7F3', label: 'Word Match' },
  FILL_BLANK:  { emoji: '✏️', bg: '#FEF9C3', label: 'Fill Blank' },
  TRUE_FALSE:  { emoji: '❓', bg: '#F3E8FF', label: 'Quiz' },
  DIALOGUE:    { emoji: '💬', bg: '#DCFCE7', label: 'Dialogue' },
  IMAGE_SPEAK: { emoji: '🖼️', bg: '#FFE4E6', label: 'Image Speak' },
}

function formatGameType(gameType: string): string {
  const config = GAME_TYPE_CONFIG[gameType as GameType]
  if (config) return config.label
  return gameType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const router = useRouter()
  const config = GAME_TYPE_CONFIG[lesson.gameType] ?? {
    emoji: '📝',
    bg: '#E5E7EB',
    label: formatGameType(lesson.gameType),
  }

  return (
    <TouchableOpacity
      style={styles.lessonCard}
      activeOpacity={0.75}
      onPress={() =>
        router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })
      }
    >
      <View style={styles.lessonRow}>
        <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
          <Text style={styles.iconEmoji}>{config.emoji}</Text>
        </View>

        <View style={styles.lessonTextCol}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonGameType}>{config.label}</Text>
        </View>

        {lesson.isCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        ) : (
          <Text style={styles.lessonChevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ModuleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data, isLoading } = useQuery({
    queryKey: ['module', id],
    queryFn: () => api.get(`/api/modules/${id}`).then((r) => r.data),
  })

  const module: ModuleDetail | undefined = data?.module
  const completionPercent = module?.completionPercent ?? 0

  return (
    <View style={styles.container}>
      {/* Navy header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator
            color={TEAL}
            size="large"
            style={styles.headerLoader}
          />
        ) : (
          <>
            <Text style={styles.headerEmoji}>{module?.emoji ?? '📚'}</Text>
            <Text style={styles.headerTitle}>{module?.title ?? ''}</Text>
            {!!module?.description && (
              <Text style={styles.headerDescription}>{module.description}</Text>
            )}

            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, completionPercent))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {module?.completedLessons ?? 0}/{module?.lessonCount ?? 0} lessons
              </Text>
            </View>
          </>
        )}
      </View>

      {/* White body */}
      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.bodyLoader}>
            <ActivityIndicator color={TEAL} size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.lessonsHeading}>Lessons</Text>
            {(module?.lessons ?? []).map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </ScrollView>
        )}
      </View>
      <BottomNavBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    color: WHITE,
    fontSize: 16,
  },
  headerLoader: {
    marginTop: 24,
  },
  headerEmoji: {
    fontSize: 32,
    marginTop: 12,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  headerDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: WHITE,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  // White body
  body: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  bodyLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  lessonsHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 12,
  },
  // Lesson card
  lessonCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  lessonTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },
  lessonGameType: {
    fontSize: 12,
    color: GREY,
    marginTop: 2,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  lessonChevron: {
    fontSize: 20,
    color: GREY,
  },
})
