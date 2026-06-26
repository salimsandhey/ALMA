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
import { NAVY, GOLD, BG, LIGHT_GREY as GREY } from '../constants/colors'
import BADGE_IMAGES from '../lib/badgeImages'

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
          <Ionicons name="chevron-back" size={24} color="#98A2B3" />
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
                <Ionicons name="lock-closed" size={16} color={GOLD} />
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
            <Ionicons name="ribbon" size={24} color={earned ? GOLD : '#CBD5E1'} />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: BG,
  },
  backBtn: { padding: 4, marginLeft: -2 },
  headerTitle: { fontSize: 21, fontWeight: '800', color: '#1C2340' },
  headerSpacer: { width: 32 },
  loader: { marginTop: 60 },
  body: { paddingHorizontal: 20, paddingTop: 10 },
  banner: {
    backgroundColor: GOLD,
    borderRadius: 22,
    minHeight: 130,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  bannerCount: { fontSize: 48, fontWeight: '900', color: '#16214B', lineHeight: 52 },
  bannerLabel: { fontSize: 15, fontWeight: '800', color: '#3A362C', marginTop: 2 },
  bannerSub: { fontSize: 13, color: '#6D5A20', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1C2340' },
  lockedSectionTitle: { color: '#98A2B3' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  badgeCard: {
    width: '30.8%',
    minHeight: 136,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
  },
  badgeCardEarned: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: GOLD,
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  badgeImageWrap: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeImage: {
    width: 34,
    height: 34,
  },
  badgeImageLocked: {
    opacity: 0.4,
  },
  badgeFallback: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C2340',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  badgeNameLocked: {
    color: '#9EA5B4',
  },
  badgeDesc: {
    fontSize: 10,
    color: '#5E6472',
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeDescLocked: {
    color: '#B9C0CC',
  },
  bottomSpacer: { height: 40 },
})
