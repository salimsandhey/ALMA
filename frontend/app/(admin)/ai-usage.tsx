import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { NAVY, GOLD, BG, CARD } from '../../constants/colors'

type Period = '7d' | '30d' | 'all'

type AiUsageData = {
  period: string
  overview: {
    totalCalls: number
    totalInputTokens: number
    totalOutputTokens: number
    totalTokens: number
    estimatedCost: number
  }
  byFeature: {
    feature: string
    label: string
    calls: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  }[]
  topUsers: {
    userId: string
    displayName: string
    calls: number
    totalTokens: number
    estimatedCost: number
  }[]
  dailyTrend: {
    date: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    calls: number
  }[]
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatCost(usd: number): string {
  if (usd < 0.001) return '< $0.001'
  return `$${usd.toFixed(4)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return String(d.getDate())
}

function formatMonthLabel(iso: string): string {
  return new Date(iso).toLocaleString('en', { month: 'short' })
}

export default function AiUsageScreen() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()
  const [period, setPeriod] = useState<Period>('30d')
  const { width } = useWindowDimensions()
  const isNarrow = width < 375

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', period],
    queryFn: async () => (await api.get(`/api/admin/ai-usage?period=${period}`)).data as AiUsageData,
    staleTime: 2 * 60 * 1000,
  })

  const maxTrend = Math.max(...(data?.dailyTrend.map((d) => d.totalTokens) ?? [1]), 1)

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>AI Token Monitor</Text>
        </View>
        <TouchableOpacity
          onPress={async () => { await deleteToken(); clearAuth(); router.replace('/(auth)/login') }}
          style={s.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Period selector */}
      <View style={s.periodRow}>
        {(['7d', '30d', 'all'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[s.periodBtn, period === p && s.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text numberOfLines={1} style={[s.periodText, period === p && s.periodTextActive]}>
              {isNarrow
                ? (p === '7d' ? '7d' : p === '30d' ? '30d' : 'All')
                : (p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'All time')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Overview stats */}
          <View style={s.statsGrid}>
            <StatCard label="Total Calls" value={String(data?.overview.totalCalls ?? 0)} icon="flash-outline" color="#6366F1" />
            <StatCard label="Total Tokens" value={formatTokens(data?.overview.totalTokens ?? 0)} icon="analytics-outline" color="#0891B2" />
            <StatCard label="Input Tokens" value={formatTokens(data?.overview.totalInputTokens ?? 0)} icon="arrow-up-outline" color="#059669" />
            <StatCard label="Output Tokens" value={formatTokens(data?.overview.totalOutputTokens ?? 0)} icon="arrow-down-outline" color="#D97706" />
          </View>

          {/* Estimated cost */}
          <View style={s.costCard}>
            <View style={s.costLeft}>
              <Ionicons name="card-outline" size={22} color={NAVY} />
              <View style={{ marginLeft: 10 }}>
                <Text numberOfLines={2} style={s.costLabel}>Estimated Cost (Gemini Flash)</Text>
                <Text numberOfLines={1} style={s.costHint}>$0.075/1M input · $0.30/1M output</Text>
              </View>
            </View>
            <Text style={s.costValue}>{formatCost(data?.overview.estimatedCost ?? 0)}</Text>
          </View>

          {/* Daily trend */}
          {(data?.dailyTrend?.length ?? 0) > 0 && (
            <View style={s.card}>
              <Text style={s.cardLabel}>DAILY TOKEN USAGE</Text>
              <View style={s.chartArea}>
                {data!.dailyTrend.map((day) => {
                  const barH = maxTrend > 0 ? Math.max(4, Math.round((day.totalTokens / maxTrend) * 80)) : 4
                  return (
                    <View key={day.date} style={s.barCol}>
                      <Text style={s.barCount}>{day.calls > 0 ? day.calls : ''}</Text>
                      <View style={[s.bar, { height: barH, backgroundColor: day.totalTokens > 0 ? NAVY : '#E5E7EB' }]} />
                      <View style={s.barLabelWrap}>
                        <Text style={s.barDay}>{formatDate(day.date)}</Text>
                        <Text style={s.barMonth}>{formatMonthLabel(day.date)}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* By feature */}
          <View style={s.card}>
            <Text style={s.cardLabel}>BY FEATURE</Text>
            {(data?.byFeature ?? []).length === 0 && (
              <Text style={s.empty}>No AI usage logged yet.</Text>
            )}
            {(data?.byFeature ?? []).map((f, i) => {
              const pct = data!.overview.totalTokens > 0
                ? Math.round((f.totalTokens / data!.overview.totalTokens) * 100)
                : 0
              return (
                <View key={f.feature} style={[s.featureRow, i < (data?.byFeature.length ?? 0) - 1 && s.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <View style={s.featureTopRow}>
                      <Text style={s.featureName}>{f.label}</Text>
                      <Text style={s.featureCost}>{formatCost(f.estimatedCost)}</Text>
                    </View>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.featureMeta}>{f.calls} calls · {formatTokens(f.totalTokens)} tokens · {pct}%</Text>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Top users */}
          <View style={s.card}>
            <Text style={s.cardLabel}>TOP USERS BY TOKEN USAGE</Text>
            {(data?.topUsers ?? []).length === 0 && (
              <Text style={s.empty}>No usage data yet.</Text>
            )}
            {(data?.topUsers ?? []).map((u, i) => (
              <View key={u.userId} style={[s.userRow, i < (data?.topUsers.length ?? 0) - 1 && s.rowBorder]}>
                <View style={s.userRank}>
                  <Text style={s.rankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={s.userName}>{u.displayName}</Text>
                  <Text style={s.userMeta}>{u.calls} calls · {formatTokens(u.totalTokens)} tokens</Text>
                </View>
                <Text style={s.userCost}>{formatCost(u.estimatedCost)}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  logoutBtn:   { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },

  periodRow:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  periodBtn:       { flex: 1, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center' },
  periodBtnActive: { backgroundColor: NAVY },
  periodText:      { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  periodTextActive:{ color: '#FFF', fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:  { backgroundColor: CARD, borderRadius: 12, padding: 14, flex: 1, minWidth: '44%', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6B7280' },

  costCard:  { backgroundColor: CARD, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  costLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  costLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  costHint:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  costValue: { fontSize: 20, fontWeight: '700', color: NAVY },

  card:      { backgroundColor: CARD, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 14 },
  empty:     { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  // Chart
  chartArea:    { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 150 },
  barCol:       { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar:          { width: '80%', borderRadius: 3, minHeight: 4, maxWidth: 20 },
  barLabelWrap: { alignItems: 'center', marginTop: 4, height: 28 },
  barDay:       { fontSize: 8, color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: 11 },
  barMonth:     { fontSize: 7, color: '#9CA3AF', textAlign: 'center', lineHeight: 10 },
  barCount:     { fontSize: 7, color: '#6B7280', textAlign: 'center', marginBottom: 2 },

  // By feature
  featureRow:    { paddingVertical: 12 },
  featureTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  featureName:   { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  featureCost:   { fontSize: 12, fontWeight: '600', color: NAVY },
  barBg:         { height: 5, backgroundColor: '#E5E7EB', borderRadius: 10, marginBottom: 4 },
  barFill:       { height: 5, backgroundColor: NAVY, borderRadius: 10 },
  featureMeta:   { fontSize: 11, color: '#9CA3AF' },

  // Top users
  userRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  userRank:  { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  rankText:  { fontSize: 11, fontWeight: '700', color: NAVY },
  userName:  { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  userMeta:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  userCost:  { fontSize: 13, fontWeight: '700', color: NAVY, flexShrink: 0 },
})
