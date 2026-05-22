import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type DimensionValue,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import Svg, { Circle } from 'react-native-svg'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { countryFlag } from '../../lib/countries'

const NAVY = '#0B1F4B'
const GOLD = '#F5A623'
const GREY = '#6B7280'
const BG = '#FFFFFF'

type ModuleItem = {
  title: string
  lessonCount: number
  completionPercent: number
}

type LeaderboardItem = {
  userId?: string
  id?: string
  displayName?: string
  xp?: number
  xpTotal?: number
  country?: string | null
}

type SummaryResponse = {
  xpTotal?: number
  streakCount?: number
  completedLessons?: number
}

type ModulesResponse = {
  modules?: ModuleItem[]
}

type LeaderboardResponse = {
  leaderboard?: LeaderboardItem[]
  currentUserRank?: number
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 70
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPercent = Math.max(0, Math.min(100, percent))
  const offset = circumference - (clampedPercent / 100) * circumference

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.26)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={GOLD}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.progressPercentText}>{clampedPercent}%</Text>
    </View>
  )
}

function SkeletonBox({ height, width = '100%', radius = 12 }: { height: number; width?: DimensionValue; radius?: number }) {
  return <View style={[styles.skeleton, { height, width, borderRadius: radius }]} />
}

function getInitial(name?: string) {
  const raw = (name || '').trim()
  return raw ? raw.charAt(0).toUpperCase() : 'A'
}

function getRankBadge(rank: number) {
  if (rank === 1) return '\uD83E\uDD47'
  if (rank === 2) return '\uD83E\uDD48'
  if (rank === 3) return '\uD83E\uDD49'
  return null
}

export default function StudentHome() {
  const { user } = useAuthStore()

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryResponse>({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/api/progress/summary').then((r) => r.data),
  })

  const { data: modulesData, isLoading: modulesLoading } = useQuery<ModulesResponse>({
    queryKey: ['modules'],
    queryFn: () => api.get('/api/modules').then((r) => r.data),
  })

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/api/leaderboard?limit=5').then((r) => r.data),
  })

  const xpTotal = summary?.xpTotal ?? user?.xpTotal ?? 0
  const streakCount = summary?.streakCount ?? user?.streakCount ?? 0
  const completedLessons = summary?.completedLessons ?? 0
  const totalLessons = modulesData?.modules?.reduce((sum, m) => sum + (m.lessonCount ?? 0), 0) ?? 56
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const continueModule = modulesData?.modules?.find((m) => (m.completionPercent ?? 0) < 100)
  const continueLessonTitle = continueModule?.title ?? 'Start Learning'

  const leaderboard = leaderboardData?.leaderboard ?? []
  const currentUserRank = leaderboardData?.currentUserRank

  const displayName = user?.displayName?.trim() || 'Learner'
  const userInitial = getInitial(displayName)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>BEGINNER</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
        </View>

        <Text style={styles.greeting}>{`Hey, ${displayName} \uD83D\uDC4B`}</Text>

        {summaryLoading ? (
          <View style={styles.statsRow}>
            <SkeletonBox height={96} radius={16} width="48%" />
            <SkeletonBox height={96} radius={16} width="48%" />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>{'\uD83D\uDD25'}</Text>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streakCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>{'\u2B50'}</Text>
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.xpValue}>{xpTotal}</Text>
            </View>
          </View>
        )}

        {modulesLoading ? (
          <SkeletonBox height={220} radius={20} />
        ) : (
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <ProgressRing percent={percent} />
              <View style={styles.progressTextWrap}>
                <Text style={styles.progressKicker}>Overall Progress</Text>
                <Text style={styles.progressMainText}>{`${completedLessons} of ${totalLessons} lessons`}</Text>
                <Text style={styles.progressSubText}>{`Keep going! \uD83D\uDCAA`}</Text>
              </View>
            </View>

            <View style={styles.progressDivider} />

            <TouchableOpacity style={styles.continueRow} activeOpacity={0.85}>
              <Text style={styles.continueEmoji}>{'\uD83D\uDC31'}</Text>
              <View style={styles.continueTextWrap}>
                <Text style={styles.continueKicker}>CONTINUE LEARNING</Text>
                <Text style={styles.continueTitle}>{continueLessonTitle}</Text>
              </View>
              <Text style={styles.continueArrow}>{'\u203A'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.aiCoachCard}>
          <View style={styles.robotSquare}>
            <Text style={styles.robotEmoji}>{'\uD83E\uDD16'}</Text>
          </View>
          <View style={styles.aiTextWrap}>
            <Text style={styles.aiTitle}>AI English Coach</Text>
            <Text style={styles.aiSubtitle}>Speak, chat & get instant grammar corrections</Text>
          </View>
          <TouchableOpacity style={styles.startButton} activeOpacity={0.85}>
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.challengeRow} activeOpacity={0.85}>
          <View style={styles.challengeIconWrap}>
            <Text style={styles.challengeIcon}>{'\u26A1'}</Text>
          </View>
          <View style={styles.challengeTextWrap}>
            <Text style={styles.challengeTitle}>Daily Challenge</Text>
            <Text style={styles.challengeSubtitle}>Quick quiz \u2014 earn bonus XP</Text>
          </View>
          <Text style={styles.challengeChevron}>{'\u203A'}</Text>
        </TouchableOpacity>

        <View style={styles.topLearnersHeader}>
          <Text style={styles.topLearnersTitle}>{'\uD83C\uDFC6 Top Learners'}</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.viewAllText}>{'View All \u2192'}</Text>
          </TouchableOpacity>
        </View>

        {leaderboardLoading ? (
          <View style={styles.leaderboardList}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <SkeletonBox key={idx} height={52} radius={12} />
            ))}
          </View>
        ) : (
          <View style={styles.leaderboardList}>
            {leaderboard.map((item, idx) => {
              const rank = idx + 1
              const medal = getRankBadge(rank)
              const name = item.displayName || 'Learner'
              const initial = getInitial(name)
              const xp = item.xp ?? item.xpTotal ?? 0
              const uid = item.userId ?? item.id ?? `${name}-${rank}`
              const isCurrentUser =
                (user?.id && (item.userId === user.id || item.id === user.id)) ||
                (!!currentUserRank && currentUserRank === rank)
              const flag = item.country ? countryFlag(item.country) : null

              return (
                <View
                  key={uid}
                  style={[styles.learnerRow, isCurrentUser && styles.currentUserRow]}
                >
                  {medal ? (
                    <Text style={styles.medalText}>{medal}</Text>
                  ) : (
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankCircleText}>{rank}</Text>
                    </View>
                  )}

                  <View style={styles.learnerAvatar}>
                    <Text style={styles.learnerAvatarText}>{initial}</Text>
                  </View>

                  <View style={styles.learnerNameRow}>
                    <Text style={styles.learnerName} numberOfLines={1}>
                      {name}
                    </Text>
                    {flag ? <Text style={styles.learnerFlag}>{flag}</Text> : null}
                  </View>

                  <Text style={styles.learnerXp}>{`${xp} XP`}</Text>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const baseCardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    borderColor: NAVY,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelBadgeText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  greeting: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
    color: NAVY,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...baseCardShadow,
  },
  statEmoji: {
    fontSize: 16,
  },
  statLabel: {
    marginTop: 6,
    color: GREY,
    fontSize: 12,
  },
  statValue: {
    marginTop: 4,
    color: NAVY,
    fontSize: 28,
    fontWeight: '700',
  },
  xpValue: {
    marginTop: 4,
    color: GOLD,
    fontSize: 28,
    fontWeight: '700',
  },
  progressCard: {
    marginTop: 16,
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  progressTextWrap: {
    flex: 1,
    marginLeft: 16,
  },
  progressKicker: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressMainText: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressSubText: {
    marginTop: 4,
    color: GOLD,
    fontSize: 13,
  },
  progressDivider: {
    marginVertical: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  continueRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueEmoji: {
    fontSize: 24,
  },
  continueTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  continueKicker: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  continueTitle: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  continueArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  aiCoachCard: {
    marginTop: 16,
    backgroundColor: GOLD,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  robotSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotEmoji: {
    fontSize: 24,
  },
  aiTextWrap: {
    flex: 1,
    marginHorizontal: 14,
  },
  aiTitle: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  aiSubtitle: {
    marginTop: 3,
    color: 'rgba(11,31,75,0.8)',
    fontSize: 12,
    lineHeight: 17,
  },
  startButton: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  challengeRow: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...baseCardShadow,
  },
  challengeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIcon: {
    fontSize: 18,
    color: GOLD,
  },
  challengeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  challengeTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  challengeSubtitle: {
    marginTop: 2,
    color: GREY,
    fontSize: 12,
  },
  challengeChevron: {
    color: GREY,
    fontSize: 16,
  },
  topLearnersHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLearnersTitle: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardList: {
    marginTop: 12,
    gap: 10,
  },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  currentUserRow: {
    backgroundColor: 'rgba(11,31,75,0.06)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  medalText: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleText: {
    color: GREY,
    fontSize: 12,
    fontWeight: '700',
  },
  learnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  learnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  learnerNameRow: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  learnerName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  learnerFlag: {
    fontSize: 14,
  },
  learnerXp: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
  },
  skeleton: {
    marginTop: 16,
    backgroundColor: 'rgba(11,31,75,0.15)',
  },
})
