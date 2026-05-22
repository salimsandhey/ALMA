import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { Song } from '../../../lib/songs'
import { useMusicStore } from '../../../stores/musicStore'
import { useAuthStore } from '../../../stores/authStore'
import { api } from '../../../lib/api'
import { Colors } from '../../../constants/colors'
import BottomNavBar from '../../../components/BottomNavBar'

function BadgePill({ name }: { name: string }) {
  const scale = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 7,
    }).start()
  }, [])
  return (
    <Animated.View style={[styles.badgePill, { transform: [{ scale }] }]}>
      <Text style={styles.badgePillText}>🏆 {name}</Text>
    </Animated.View>
  )
}

export default function ResultsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { lineResults, xpAwarded, setXpAwarded, reset, currentSong } = useMusicStore()

  const { data: fetchedSong } = useQuery({
    queryKey: ['song', id],
    queryFn: async () => {
      const res = await api.get(`/api/music/songs/${id}`)
      return res.data.song as Song
    },
    enabled: !!id && currentSong?.id !== id,
  })

  const song = currentSong?.id === id ? currentSong : fetchedSong ?? null
  const { user, setUser } = useAuthStore()

  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([])
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    const saveProgress = async () => {
      if (xpAwarded) return
      setSavingProgress(true)
      try {
        const response = await api.post('/api/progress/music/complete')
        setXpAwarded(true)
        if (response.data) {
          const { newXpTotal, newStreakCount, badgesUnlocked } = response.data
          if (user) {
            setUser({
              ...user,
              xpTotal: newXpTotal,
              streakCount: newStreakCount,
            })
          }
          if (Array.isArray(badgesUnlocked)) {
            setUnlockedBadges(badgesUnlocked)
          }
        }
      } catch (error) {
        console.error('Failed to submit music progress to backend:', error)
      } finally {
        setSavingProgress(false)
      }
    }

    saveProgress()
  }, [])

  if (!song) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Song not found</Text>
      </SafeAreaView>
    )
  }

  const averageScore = lineResults.length > 0
    ? Math.round(lineResults.reduce((s, r) => s + r.score, 0) / lineResults.length)
    : 0

  const handleListenFirst = async () => {
    try {
      const supported = await Linking.canOpenURL(song.youtubeUrl)
      if (supported) {
        await Linking.openURL(song.youtubeUrl)
      }
    } catch (error) {
      console.error('Failed to open YouTube URL:', error)
    }
  }

  const handleTryAgain = () => {
    // Reset Zustand store state for this song
    useMusicStore.getState().startKaraoke(song)
    router.replace({ pathname: '/music/karaoke/[id]', params: { id: song.id } })
  }

  const handleFinish = () => {
    reset()
    router.replace('/(student)/music')
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return Colors.green
    if (score >= 60) return Colors.gold
    return Colors.red
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sing Results</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Mini Card */}
        <View style={styles.miniCard}>
          <View style={styles.miniCardRow}>
            <Text style={styles.miniEmoji}>{song.emoji}</Text>
            <View style={styles.miniText}>
              <Text style={styles.miniTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.miniGenre}>{song.genre}</Text>
            </View>
            <TouchableOpacity
              style={styles.listenBadge}
              onPress={handleListenFirst}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-youtube" size={14} color="#FF0000" />
              <Text style={styles.listenBadgeText}>Listen First</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>OVERALL PRONUNCIATION</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(averageScore) }]}>
            {averageScore}%
          </Text>
          {savingProgress ? (
            <ActivityIndicator size="small" color={Colors.teal} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.xpText}>+10 ALMA Points earned!</Text>
          )}
        </View>

        {/* Badge Unlocked Celebration */}
        {unlockedBadges.length > 0 && (
          <View style={styles.badgeSection}>
            <Text style={styles.badgeHeading}>🏅 Badge{unlockedBadges.length > 1 ? 's' : ''} Unlocked!</Text>
            {unlockedBadges.map((badge, i) => (
              <BadgePill key={i} name={badge} />
            ))}
          </View>
        )}

        {/* Line Breakdown Header */}
        <Text style={styles.breakdownHeader}>Line-by-line Review</Text>

        {/* Line Breakdown List */}
        <View style={styles.breakdownList}>
          {lineResults.map((result, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownTextCol}>
                <Text style={styles.lyricLineText}>{result.line}</Text>
                <Text style={styles.spokenText} numberOfLines={1}>
                  You sang: "{result.spoken}"
                </Text>
              </View>
              <Text style={[styles.lineScore, { color: getScoreColor(result.score) }]}>
                {result.score}%
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.btnCol}>
          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={handleTryAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.tryAgainBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F3F7',
  },
  header: {
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  miniCard: {
    backgroundColor: Colors.midBlue,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  miniCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  miniText: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  miniGenre: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  listenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listenBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textDark,
  },
  scoreCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 8,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: 6,
  },
  badgeSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    gap: 10,
  },
  badgeHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 6,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    width: '100%',
    alignItems: 'center',
  },
  badgePillText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 12,
  },
  breakdownList: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 28,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  lyricLineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  spokenText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    fontStyle: 'italic',
  },
  lineScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnCol: {
    gap: 12,
  },
  tryAgainBtn: {
    height: 50,
    backgroundColor: Colors.gold,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  tryAgainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
  },
  finishBtn: {
    height: 50,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 40,
  },
})
