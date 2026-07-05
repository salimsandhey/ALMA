import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator, Alert, Image, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { generateMasterPDF } from '../../lib/pdfReports'
import { NAVY, GOLD, BG, CARD } from '../../constants/colors'

type OverviewData = {
  totalStudents: number
  activeToday: number
  avgCompletion: number
  needsHelpCount: number
  needsHelpStudents: { id: string; displayName: string; avatarUrl: string | null; isActive: boolean; completionPct: number }[]
  moduleCompletionRates: { id: string; title: string; imageUrl: string | null; completionPct: number }[]
}

const MODULE_EMOJIS: Record<string, string> = {
  'Personal Information': '👤',
  'Food & Drink': '🍽️',
  'Pets & Animals': '🐾',
  'Friends & Social Life': '👥',
  'Hobbies & Entertainment': '🎨',
  'Home & Country': '🏡',
  'Leisure & Activities': '🏄',
  'Travel & Vacations': '✈️',
  'Hotel & Hospitality': '🏨',
  'Restaurant & Food Service': '🍴',
  'Handling Complaints': '💬',
  'News & Sports': '📰',
  'Tourism': '🗺️',
  'Languages': '🌐',
}

export default function OverviewScreen() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()
  const [helpModalVisible, setHelpModalVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { width } = useWindowDimensions()
  const isNarrow = width < 380

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await api.get('/api/admin/overview')
      return res.data
    },
  })

  const handleLogout = async () => {
    await deleteToken()
    clearAuth()
    router.replace('/(auth)/login')
  }

  const handleDownloadReport = async () => {
    try {
      setDownloading(true)
      const [overviewRes, studentsRes] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/students', { params: { limit: 200 } }),
      ])
      const overview = overviewRes.data
      const students = studentsRes.data.students
      await generateMasterPDF({
        totalStudents:         overview.totalStudents,
        activeToday:           overview.activeToday,
        avgCompletion:         overview.avgCompletion,
        moduleCompletionRates: overview.moduleCompletionRates,
        students: students.map((s: any) => ({
          displayName:    s.displayName,
          email:          s.email,
          countryName:    s.countryName,
          isActive:       s.isActive,
          xpTotal:        s.xpTotal,
          streakCount:    s.streakCount,
          completionPct:  s.completionPct,
          lastActiveDate: s.lastActiveDate,
          createdAt:      s.createdAt,
        })),
      })
    } catch {
      Alert.alert('Error', 'Failed to generate report.')
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Dark navy header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Stats 2×2 grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={22} color={NAVY} />
            <Text style={styles.statValue}>{data?.totalStudents ?? 0}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={22} color="#F97316" />
            <Text style={styles.statValue}>{data?.activeToday ?? 0}</Text>
            <Text style={styles.statLabel}>Active Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={22} color="#10B981" />
            <Text style={styles.statValue}>{data?.avgCompletion ?? 0}%</Text>
            <Text style={styles.statLabel}>Avg Completion</Text>
          </View>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardAlert]}
            onPress={() => setHelpModalVisible(true)}
          >
            <Ionicons name="warning-outline" size={22} color="#EF4444" />
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{data?.needsHelpCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: '#EF4444' }]}>Needs Help</Text>
          </TouchableOpacity>
        </View>

        {/* Section heading + download button — on grey BG, no card wrapper */}
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleHeading}>Module Completion{'\n'}Rates</Text>
          <TouchableOpacity
            style={[styles.downloadBtn, { flexShrink: 1 }]}
            onPress={handleDownloadReport}
            disabled={downloading}
          >
            {downloading
              ? <ActivityIndicator size="small" color={NAVY} />
              : <>
                  <Ionicons name="download-outline" size={16} color={NAVY} />
                  {!isNarrow && <Text style={styles.downloadBtnText} numberOfLines={1}>Download Master Report</Text>}
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Each module — its own white card with gap between */}
        {(data?.moduleCompletionRates ?? []).map((mod) => (
          <View key={mod.id} style={styles.moduleRow}>
            <Text style={styles.moduleEmoji}>{MODULE_EMOJIS[mod.title] ?? '📚'}</Text>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: mod.completionPct > 0 ? `${Math.min(mod.completionPct, 100)}%` : 4 },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.modulePct}>{mod.completionPct}%</Text>
          </View>
        ))}
      </ScrollView>

      {/* Needs Help Modal */}
      <Modal visible={helpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {/* Backdrop — tap to close, sits behind the sheet */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setHelpModalVisible(false)}
            activeOpacity={1}
          />
          {/* Sheet — separate from backdrop so scrolling doesn't close */}
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="warning-outline" size={20} color="#EF4444" />
                <Text style={styles.modalTitle}>
                  Students Needing Help ({data?.needsHelpCount ?? 0})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              style={{ maxHeight: 300 }}
              data={data?.needsHelpStudents ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.helpRow}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarCircle} />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>
                        {item.displayName?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.helpName}>{item.displayName}</Text>
                    <Text style={styles.helpSub}>
                      <Text style={{ color: '#EF4444' }}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                      {' · '}{item.completionPct}% done
                    </Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '44%',
    flexGrow: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardAlert: { borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FFF7F7' },
  statValue: { fontSize: 28, fontWeight: '700', color: NAVY },
  statLabel: { fontSize: 12, color: '#6B7280' },

  // Section heading row — sits on grey BG, no card
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  moduleHeading: { fontSize: 16, fontWeight: '700', color: '#1F2937', lineHeight: 22 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 48,
    justifyContent: 'center',
    flexShrink: 1,
  },
  downloadBtnText: { fontSize: 12, fontWeight: '700', color: NAVY },

  // Each module row is its own white card with gap
  moduleRow: {
    backgroundColor: CARD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  moduleEmoji: { fontSize: 20, width: 32, marginRight: 10 },
  moduleInfo: { flex: 1, marginRight: 10 },
  moduleTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  progressBarBg: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 10 },
  progressBarFill: { height: 5, backgroundColor: NAVY, borderRadius: 10, minWidth: 4 },
  modulePct: { fontSize: 12, color: '#6B7280', fontWeight: '600', minWidth: 30, textAlign: 'right' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', position: 'relative' },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  helpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: NAVY },
  helpName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  helpSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
})
