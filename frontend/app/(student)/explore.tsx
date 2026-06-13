import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'
import { NAVY, GOLD, GREY, GREEN, BG } from '../../constants/colors'

type EntertainmentItem = {
  id: string
  type: 'VIDEO' | 'ARTICLE'
  title: string
  description: string
  url: string
  duration: string | null
  xpReward: number
  questionCount: number
  completed: boolean
  score: number | null
  xpEarned: number | null
}

type EntertainmentResponse = {
  items: EntertainmentItem[]
  completed: number
  total: number
}

function ContentCard({ item }: { item: EntertainmentItem }) {
  const router = useRouter()
  const isVideo = item.type === 'VIDEO'

  const openContent = useCallback(() => {
    Linking.openURL(item.url)
  }, [item.url])

  const goToQuiz = useCallback(() => {
    router.push(`/entertainment/${item.id}`)
  }, [item.id])

  return (
    <View style={[styles.card, item.completed && styles.cardCompleted]}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>{isVideo ? '🎬' : '📖'}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, isVideo ? styles.typeBadgeVideo : styles.typeBadgeArticle]}>
              <Text style={[styles.typeBadgeText, isVideo ? styles.typeBadgeTextVideo : styles.typeBadgeTextArticle]}>
                {isVideo ? 'VIDEO' : 'ARTICLE'}
              </Text>
            </View>
            {item.completed && (
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark-circle" size={13} color={GREEN} />
                <Text style={styles.doneBadgeText}>Done · {item.xpEarned} XP</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.openBtn} onPress={openContent} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={15} color={NAVY} />
          <Text style={styles.openBtnText}>{isVideo ? 'Watch Video' : 'Read Article'}</Text>
        </TouchableOpacity>

        {!item.completed && (
          <TouchableOpacity style={styles.quizBtn} onPress={goToQuiz} activeOpacity={0.8}>
            <Ionicons name="mic-outline" size={15} color="#FFFFFF" />
            <Text style={styles.quizBtnText}>Take Quiz</Text>
          </TouchableOpacity>
        )}

        {item.completed && (
          <TouchableOpacity style={styles.reviewBtn} onPress={goToQuiz} activeOpacity={0.8}>
            <Text style={styles.reviewBtnText}>View Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default function EntertainmentScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<EntertainmentResponse>({
    queryKey: ['entertainment'],
    queryFn: () => api.get('/api/entertainment').then((r) => r.data),
  })

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['entertainment'] })
    }, [queryClient])
  )

  const videos = data?.items.filter((i) => i.type === 'VIDEO') ?? []
  const articles = data?.items.filter((i) => i.type === 'ARTICLE') ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Entertainment 🎬</Text>
        <Text style={styles.pageSubtitle}>Watch or read, then take the quiz to earn XP</Text>

        {data && (
          <Text style={styles.progressText}>
            <Text style={styles.progressCount}>{data.completed}/{data.total} completed</Text>
          </Text>
        )}

        {isLoading && (
          <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 60 }} />
        )}

        {error && !isLoading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load content.</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && videos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🎬 Videos</Text>
            {videos.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </>
        )}

        {!isLoading && !error && articles.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📚 Articles</Text>
            {articles.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: GREY,
  },
  progressText: {
    marginTop: 6,
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardCompleted: {
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardMeta: {
    flex: 1,
    gap: 4,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeVideo: {
    backgroundColor: '#EEF2FF',
  },
  typeBadgeArticle: {
    backgroundColor: '#FEF9C3',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeBadgeTextVideo: {
    color: '#4F46E5',
  },
  typeBadgeTextArticle: {
    color: '#854D0E',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    color: GREY,
    lineHeight: 17,
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 9,
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
  quizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 9,
  },
  quizBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 10,
    paddingVertical: 9,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  errorBox: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: GREY,
    fontSize: 15,
  },
  retryBtn: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
})
