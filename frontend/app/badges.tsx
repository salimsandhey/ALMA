import React from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const GREY = '#9CA3AF'

const BADGE_IMAGES: Record<string, any> = {
  complete_first_lesson: require('../assets/badges/first step.png'),
  complete_first_dialogue: require('../assets/badges/first converstation.png'),
  complete_module_hotel: require('../assets/badges/hospitality hero.png'),
  complete_10_lessons: require('../assets/badges/word wizard.png'),
  quiz_perfect_score: require('../assets/badges/quiz master.png'),
  streak_3: require('../assets/badges/on fire.png'),
  streak_7: require('../assets/badges/week warrior.png'),
  streak_30: require('../assets/badges/monthly marvel.png'),
  complete_half_modules: require('../assets/badges/highway there.png'),
  complete_all_modules: require('../assets/badges/alma graduate.png'),
  perfect_module: require('../assets/badges/perfect score.png'),
  first_entertainment: require('../assets/badges/world explorer.png'),
}

type Badge = {
  id: string
  name: string
  description: string
  condition: string
  earned: boolean
  earnedAt: string | null
}

export default function Badges() {
  const router = useRouter()

  const { data, isLoading } = useQuery<{ badges: Badge[] }>({
    queryKey: ['badges'],
    queryFn: () => api.get('/api/badges').then((response) => response.data),
  })

  const badges = data?.badges ?? []
  const earned = badges.filter((badge) => badge.earned)
  const locked = badges.filter((badge) => !badge.earned)
  const remaining = Math.max(badges.length - earned.length, 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badges</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={NAVY} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.banner}>
            <Text style={styles.bannerCount}>{earned.length}</Text>
            <Text style={styles.bannerLabel}>Badge Earned</Text>
            {remaining > 0 ? <Text style={styles.bannerSub}>{remaining} more to unlock</Text> : null}
          </View>

          {earned.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={18} color={GOLD} />
                <Text style={styles.sectionTitle}>Earned</Text>
              </View>
              <View style={styles.grid}>
                {earned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
              </View>
            </>
          ) : null}

          {locked.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed" size={16} color={GREY} />
                <Text style={[styles.sectionTitle, styles.lockedSectionTitle]}>Locked</Text>
              </View>
              <View style={styles.grid}>
                {locked.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const imageSource = BADGE_IMAGES[badge.condition]

  return (
    <View style={[styles.badgeCard, earned ? styles.badgeCardEarned : styles.badgeCardLocked]}>
      <View style={styles.badgeImageWrap}>
        {imageSource ? (
          <Image source={imageSource} style={[styles.badgeImage, !earned && styles.badgeImageLocked]} resizeMode="contain" />
        ) : (
          <View style={styles.badgeFallback}>
            <Ionicons name="ribbon" size={30} color={earned ? GOLD : '#CBD5E1'} />
          </View>
        )}
      </View>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
      <Text style={[styles.badgeDesc, !earned && styles.badgeDescLocked]} numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSpacer: { width: 30 },
  loader: { marginTop: 60 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  banner: {
    backgroundColor: GOLD,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerCount: { fontSize: 52, fontWeight: '900', color: '#1F2937', lineHeight: 56 },
  bannerLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(0,0,0,0.55)', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  lockedSectionTitle: { color: GREY },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badgeCard: {
    width: '30.5%',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeCardEarned: {
    backgroundColor: '#FFFFFF',
    borderColor: GOLD,
  },
  badgeCardLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  badgeImageWrap: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeImage: {
    width: 52,
    height: 52,
  },
  badgeImageLocked: {
    opacity: 0.3,
  },
  badgeFallback: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: '#94A3B8',
  },
  badgeDesc: {
    fontSize: 9,
    color: GREY,
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeDescLocked: {
    color: '#CBD5E1',
  },
  bottomSpacer: { height: 32 },
})
