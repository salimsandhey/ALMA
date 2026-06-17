import React, { useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { countryFlag } from '../../lib/countries'
import { NAVY, GOLD, GREY } from '../../constants/colors'

const BG = '#F0F4FF'

type LeaderboardEntry = {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  xpTotal: number
  country: string | null
}

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[]
  currentUserRank: number | null
}

function getInitial(name: string) {
  return (name || 'A').trim().charAt(0).toUpperCase()
}

function Avatar({ name, avatarUrl, size, borderColor }: { name: string; avatarUrl?: string | null; size: number; borderColor?: string }) {
  const circleStyle = [
    avatarStyles.circle,
    { width: size, height: size, borderRadius: size / 2 },
    borderColor ? { borderWidth: 3, borderColor } : undefined,
  ]
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={circleStyle as any} />
  }
  return (
    <View style={circleStyle}>
      <Text style={[avatarStyles.initial, { fontSize: size * 0.38 }]}>{getInitial(name)}</Text>
    </View>
  )
}

const avatarStyles = StyleSheet.create({
  circle: {
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: NAVY,
    fontWeight: '700',
  },
})

function PodiumSpot({
  entry, place, isCurrentUser,
}: {
  entry: LeaderboardEntry
  place: 1 | 2 | 3
  isCurrentUser: boolean
}) {
  const isFirst = place === 1
  const avatarSize = isFirst ? 72 : 56
  const podiumHeights: Record<number, number> = { 1: 80, 2: 54, 3: 40 }
  const podiumColors: Record<number, string> = { 1: '#FDE68A', 2: '#E5E7EB', 3: '#FCD9AB' }
  const medalEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const borderColor = isFirst ? GOLD : place === 2 ? '#9CA3AF' : '#CD7C4A'

  return (
    <View style={[podStyles.spot, isFirst && podStyles.spotFirst]}>
      <View style={podStyles.medalBadge}>
        <Text style={podStyles.medalEmoji}>{medalEmojis[place]}</Text>
      </View>
      <View style={[
        podStyles.avatarRing,
        isFirst && { borderColor: GOLD, borderWidth: 3, borderRadius: (avatarSize + 12) / 2, padding: 4 },
      ]}>
        <Avatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={avatarSize} />
      </View>
      <Text style={podStyles.podName} numberOfLines={1}>
        {isCurrentUser ? 'You' : entry.displayName.split(' ')[0]}
      </Text>
      <Text style={podStyles.podPts}>{entry.xpTotal} Pts</Text>
      <View style={[
        podStyles.block,
        { height: podiumHeights[place], backgroundColor: podiumColors[place] },
      ]} />
    </View>
  )
}

const podStyles = StyleSheet.create({
  spot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  spotFirst: {
    marginBottom: -12,
  },
  medalBadge: {
    marginBottom: 4,
  },
  medalEmoji: {
    fontSize: 22,
  },
  avatarRing: {
    marginBottom: 6,
  },
  podName: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 90,
  },
  podPts: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  block: {
    width: '85%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
})

export default function Leaderboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard-full'],
    queryFn: () => api.get('/api/leaderboard?limit=50').then((r) => r.data),
  })

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard-full'] })
    }, [queryClient])
  )

  const leaderboard = data?.leaderboard ?? []
  const currentUserRank = data?.currentUserRank ?? null

  const showPodium = leaderboard.length >= 3
  const top3 = leaderboard.slice(0, 3)
  const rest = showPodium ? leaderboard.slice(3) : leaderboard

  const first = top3[0]
  const second = top3[1]
  const third = top3[2]

  const myEntry = leaderboard.find((e) => e.userId === user?.id)
  const myXp = myEntry?.xpTotal ?? user?.xpTotal ?? 0

  function isMe(entry: LeaderboardEntry) {
    return entry.userId === user?.id
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Your Rank card */}
          <View style={styles.rankCard}>
            <View>
              <Text style={styles.rankLabel}>Your Rank</Text>
              <Text style={styles.rankNumber}>
                {currentUserRank ? `#${currentUserRank}` : '—'}
              </Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankPtsCol}>
              <Text style={styles.rankPtsLabel}>ALMA Pts</Text>
              <Text style={styles.rankPtsValue}>{myXp}</Text>
            </View>
            <View style={styles.rankTrophyWrap}>
              <Text style={styles.rankTrophy}>🏅</Text>
            </View>
          </View>

          {/* Top 3 podium */}
          {showPodium && (
            <View style={styles.podiumWrap}>
              <View style={styles.podiumRow}>
                {second && <PodiumSpot entry={second} place={2} isCurrentUser={isMe(second)} />}
                {first && <PodiumSpot entry={first} place={1} isCurrentUser={isMe(first)} />}
                {third && <PodiumSpot entry={third} place={3} isCurrentUser={isMe(third)} />}
              </View>
            </View>
          )}

          {/* Ranked list */}
          <View style={styles.listWrap}>
            {leaderboard.length === 0 && (
              <Text style={styles.emptyText}>No learners yet. Be the first!</Text>
            )}
            {rest.map((entry) => {
              const me = isMe(entry)
              const flag = entry.country ? countryFlag(entry.country) : null
              return (
                <View key={entry.userId} style={[styles.row, me && styles.rowMe]}>
                  <Text style={[styles.rowRank, me && styles.rowRankMe]}>#{entry.rank}</Text>
                  {entry.avatarUrl ? (
                    <Image source={{ uri: entry.avatarUrl }} style={styles.rowAvatar} />
                  ) : (
                    <View style={styles.rowAvatar}>
                      <Text style={styles.rowAvatarText}>{getInitial(entry.displayName)}</Text>
                    </View>
                  )}
                  <View style={styles.rowNameWrap}>
                    {flag ? <Text style={styles.rowFlag}>{flag}</Text> : null}
                    <Text style={[styles.rowName, me && styles.rowNameMe]} numberOfLines={1}>
                      {me ? 'You' : entry.displayName}
                    </Text>
                  </View>
                  <Text style={styles.rowPts}>{entry.xpTotal} Pts</Text>
                </View>
              )
            })}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: NAVY,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Rank card
  rankCard: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  rankDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
  },
  rankPtsCol: {
    flex: 1,
  },
  rankPtsLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rankPtsValue: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  rankTrophyWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245,166,35,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTrophy: {
    fontSize: 26,
  },

  // Podium
  podiumWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },

  // Ranked list
  listWrap: {
    gap: 8,
  },
  emptyText: {
    color: GREY,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowMe: {
    borderWidth: 2,
    borderColor: NAVY,
  },
  rowRank: {
    width: 36,
    color: GREY,
    fontSize: 13,
    fontWeight: '700',
  },
  rowRankMe: {
    color: NAVY,
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowAvatarText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  rowNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  rowFlag: {
    fontSize: 15,
  },
  rowName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowNameMe: {
    fontWeight: '800',
  },
  rowPts: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
})
