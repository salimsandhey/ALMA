import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  Alert, Dimensions, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { generateStudentPDF, generateMasterPDF } from '../../lib/pdfReports'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const CARD = '#FFFFFF'
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Derive flag emoji from ISO country code e.g. 'MG' → 🇲🇬
function flagFromCode(code: string | null): string {
  if (!code || code.length !== 2) return ''
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}

type Student = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  countryCode: string | null
  countryName: string | null
  nativeLanguage: string | null
  createdAt: string
  lastActiveDate: string | null
  xpTotal: number
  streakCount: number
  isActive: boolean
  completionPct: number
}

type StudentDetail = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  age: number | null
  gender: string | null
  countryCode: string | null
  countryName: string | null
  languageCode: string | null
  languageName: string | null
  languageFlag: string | null
  xpTotal: number
  streakCount: number
  isActive: boolean
  createdAt: string
  lastActiveDate: string | null
  completionPct: number
  avgScore: number
  completedModules: number
  totalModules: number
  completedEntertainment: number
  totalEntertainment: number
  totalSongs: number
  currentModules: string[]
  needsHelp: boolean
  badges: { name: string; description: string; earnedAt: string }[]
  moduleProgress: { moduleTitle: string; totalLessons: number; isCompleted: boolean }[]
}

type Filter = 'all' | 'active' | 'inactive'
const PAGE_SIZE = 20

export default function StudentsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [downloadingMaster, setDownloadingMaster] = useState(false)
  const [downloadingStudent, setDownloadingStudent] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
    setAllStudents([])
    setHasMore(true)
  }, [filter, debouncedSearch])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-students', filter, debouncedSearch, currentPage],
    queryFn: async () => {
      const params: any = { status: filter, limit: PAGE_SIZE, page: currentPage }
      if (debouncedSearch) params.search = debouncedSearch
      const res = await api.get('/api/admin/students', { params })
      return res.data as { students: Student[]; total: number; hasMore: boolean }
    },
    staleTime: 2 * 60 * 1000,
  })

  // Accumulate pages
  useEffect(() => {
    if (!data?.students) return
    if (currentPage === 1) {
      setAllStudents(data.students)
    } else {
      setAllStudents((prev) => [...prev, ...data.students])
    }
    setHasMore(data.hasMore)
  }, [data, currentPage])

  const loadMore = useCallback(() => {
    if (!hasMore || isFetching || isLoading) return
    setCurrentPage((p) => p + 1)
  }, [hasMore, isFetching, isLoading])

  // Detail fetch — lazy, only when sheet opens
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-student-detail', selectedId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/students/${selectedId}`)
      return res.data as StudentDetail
    },
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.patch(`/api/admin/students/${userId}/status`, { isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-student-detail', selectedId] })
    },
  })

  const handleLogout = async () => {
    await deleteToken()
    clearAuth()
    router.replace('/(auth)/login')
  }

  const handleMasterReport = async () => {
    try {
      setDownloadingMaster(true)
      const [overviewRes, studentsRes] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/students', { params: { limit: 200 } }),
      ])
      const overview = overviewRes.data
      const students = studentsRes.data.students
      await generateMasterPDF({
        totalStudents:        overview.totalStudents,
        activeToday:          overview.activeToday,
        avgCompletion:        overview.avgCompletion,
        moduleCompletionRates: overview.moduleCompletionRates,
        students: students.map((s: any) => ({
          displayName:   s.displayName,
          email:         s.email,
          countryName:   s.countryName,
          isActive:      s.isActive,
          xpTotal:       s.xpTotal,
          streakCount:   s.streakCount,
          completionPct: s.completionPct,
          lastActiveDate:s.lastActiveDate,
          createdAt:     s.createdAt,
        })),
      })
    } catch {
      Alert.alert('Error', 'Failed to generate master report.')
    } finally {
      setDownloadingMaster(false)
    }
  }

  const handleStudentReport = async (studentDetail: any) => {
    try {
      setDownloadingStudent(true)
      await generateStudentPDF(studentDetail)
    } catch {
      Alert.alert('Error', 'Failed to generate report.')
    } finally {
      setDownloadingStudent(false)
    }
  }

  const renderStudent = ({ item }: { item: Student }) => {
    const flag = flagFromCode(item.countryCode)
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedId(item.id)} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          {/* Avatar */}
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}

          {/* Name + badge + country */}
          <View style={styles.cardMid}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName}>{item.displayName}</Text>
              <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {item.countryName ? (
              <Text style={styles.country}>{item.countryName} {flag}</Text>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.statFire}>🔥 {item.streakCount} Days</Text>
          <Text style={styles.statXP}>⭐ {item.xpTotal} XP</Text>
          <Text style={styles.statComplete}>✓ {item.completionPct}% Complete</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const isInitialLoading = isLoading && currentPage === 1

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Students</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.totalText}>{data?.total ?? allStudents.length} students</Text>
        <TouchableOpacity style={styles.masterReportBtn} onPress={handleMasterReport} disabled={downloadingMaster}>
          {downloadingMaster
            ? <ActivityIndicator size="small" color={NAVY} />
            : <>
                <Ionicons name="download-outline" size={14} color={NAVY} />
                <Text style={styles.masterReportText}>Download Master Report</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isInitialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <FlatList
          data={allStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
          ListFooterComponent={
            isFetching && currentPage > 1
              ? <ActivityIndicator size="small" color={NAVY} style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}

      {/* Student Detail Bottom Sheet */}
      <Modal visible={!!selectedId} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelectedId(null)}
            activeOpacity={1}
          />
          <View style={styles.sheet}>
            {/* Sheet handle */}
            <View style={styles.sheetHandle} />

            {detailLoading ? (
              <View style={styles.sheetLoading}>
                <ActivityIndicator size="large" color={NAVY} />
              </View>
            ) : detail ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                {/* Sheet header */}
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetAvatarWrap}>
                    {detail.avatarUrl ? (
                      <Image source={{ uri: detail.avatarUrl }} style={styles.sheetAvatar} />
                    ) : (
                      <View style={styles.sheetAvatar}>
                        <Text style={styles.sheetAvatarText}>{detail.displayName?.[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.sheetName}>{detail.displayName}</Text>
                      <View style={[styles.statusBadge, detail.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={[styles.statusText, detail.isActive ? styles.activeText : styles.inactiveText]}>
                          {detail.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.downloadReportBtn}
                    onPress={() => handleStudentReport(detail)}
                    disabled={downloadingStudent}
                  >
                    {downloadingStudent
                      ? <ActivityIndicator size="small" color={NAVY} />
                      : <>
                          <Ionicons name="download-outline" size={13} color={NAVY} />
                          <Text style={styles.downloadReportText}>Download Report</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>

                {/* Contact Info */}
                <SectionTitle title="CONTACT INFO" />
                <View style={styles.infoCard}>
                  <InfoRow icon="mail-outline" label="Email" value={detail.email} />
                  <InfoRow
                    icon="location-outline"
                    label="Country"
                    value={detail.countryName
                      ? `${detail.countryName} ${flagFromCode(detail.countryCode)}`
                      : 'Not set'}
                  />
                  <InfoRow
                    icon="language-outline"
                    label="Language"
                    value={detail.languageName
                      ? `${detail.languageFlag ?? ''} ${detail.languageName}`
                      : 'Not set'}
                  />
                  <InfoRow icon="calendar-outline" label="Joined" value={formatDate(detail.createdAt)} />
                  <InfoRow
                    icon="time-outline"
                    label="Last Active"
                    value={detail.lastActiveDate ? formatDate(detail.lastActiveDate) : 'Never'}
                    last
                  />
                </View>

                {/* Performance Overview */}
                <SectionTitle title="PERFORMANCE OVERVIEW" />
                <View style={styles.perfGrid}>
                  <PerfCard label="Total XP" value={`${detail.xpTotal}`} color={GOLD} />
                  <PerfCard label="Streak" value={`${detail.streakCount} days`} color="#F97316" />
                  <PerfCard label="Completion" value={`${detail.completionPct}%`} color="#10B981" />
                  <PerfCard label="Avg Score" value={`${detail.avgScore} pts`} color={NAVY} />
                </View>

                {/* Current Modules */}
                {detail.currentModules.length > 0 && (
                  <>
                    <SectionTitle title="CURRENTLY WORKING ON" />
                    <View style={styles.infoCard}>
                      {detail.currentModules.map((m, i) => (
                        <InfoRow
                          key={i}
                          icon="book-outline"
                          label={`Module ${i + 1}`}
                          value={m}
                          last={i === detail.currentModules.length - 1}
                        />
                      ))}
                    </View>
                  </>
                )}

                {/* Module Progress */}
                <SectionTitle title="MODULE PROGRESS" />
                <View style={styles.infoCard}>
                  {detail.moduleProgress.length === 0
                    ? <Text style={styles.emptySection}>No modules started yet.</Text>
                    : detail.moduleProgress.map((mp, i) => (
                        <View
                          key={i}
                          style={[styles.moduleRow, i < detail.moduleProgress.length - 1 && styles.moduleRowBorder]}
                        >
                          <Text style={styles.moduleTitle}>{mp.moduleTitle}</Text>
                          <View style={[
                            styles.moduleStatus,
                            mp.isCompleted ? styles.moduleStatusDone : styles.moduleStatusPending,
                          ]}>
                            <Text style={[
                              styles.moduleStatusText,
                              mp.isCompleted ? styles.moduleStatusTextDone : styles.moduleStatusTextPending,
                            ]}>
                              {mp.isCompleted ? 'Completed' : 'In Progress'}
                            </Text>
                          </View>
                        </View>
                      ))
                  }
                </View>

                {/* Learning Stats */}
                <SectionTitle title="LEARNING STATS" />
                <View style={styles.infoCard}>
                  <InfoRow icon="cube-outline" label="Modules Done" value={`${detail.completedModules} of ${detail.totalModules}`} />
                  <InfoRow icon="film-outline" label="Entertainment" value={`${detail.completedEntertainment} of ${detail.totalEntertainment}`} />
                  <InfoRow icon="musical-notes-outline" label="Songs" value={`0 of ${detail.totalSongs}`} last />
                </View>

                {/* Badges */}
                {detail.badges.length > 0 && (
                  <>
                    <SectionTitle title="BADGES EARNED" />
                    <View style={styles.infoCard}>
                      {detail.badges.map((b, i) => (
                        <View key={i} style={[styles.badgeRow, i < detail.badges.length - 1 && styles.moduleRowBorder]}>
                          <Text style={styles.badgeIcon}>🏅</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.badgeName}>{b.name}</Text>
                            <Text style={styles.badgeDesc}>{b.description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Activate / Deactivate */}
                <TouchableOpacity
                  style={[styles.toggleBtn, detail.isActive ? styles.deactivateBtn : styles.activateBtn]}
                  onPress={() => {
                    toggleStatus.mutate({ userId: detail.id, isActive: !detail.isActive })
                    setSelectedId(null)
                  }}
                >
                  <Text style={styles.toggleBtnText}>
                    {detail.isActive ? 'Deactivate Account' : 'Activate Account'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

function InfoRow({
  icon, label, value, last = false,
}: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Ionicons name={icon} size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

function PerfCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.perfCard}>
      <Text style={[styles.perfValue, { color }]}>{value}</Text>
      <Text style={styles.perfLabel}>{label}</Text>
    </View>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },

  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  totalText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  masterReportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    minWidth: 48, justifyContent: 'center',
  },
  masterReportText: { fontSize: 12, fontWeight: '700', color: NAVY },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD,
    borderRadius: 10, marginHorizontal: 16, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: NAVY },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  // Student card
  card: {
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: NAVY },
  cardMid: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  country: { fontSize: 12, color: '#6B7280' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadge: { backgroundColor: '#D1FAE5' },
  inactiveBadge: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '600' },
  activeText: { color: '#059669' },
  inactiveText: { color: '#6B7280' },

  statsRow: { flexDirection: 'row', gap: 14 },
  statFire: { fontSize: 12, color: '#F97316', fontWeight: '600' },
  statXP: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  statComplete: { fontSize: 12, color: '#059669', fontWeight: '600' },

  // Bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.91,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetLoading: { height: 200, justifyContent: 'center', alignItems: 'center' },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 20 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sheetAvatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  sheetAvatarText: { fontSize: 22, fontWeight: '700', color: NAVY },
  sheetName: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4 },

  downloadReportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: NAVY, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  downloadReportText: { fontSize: 11, fontWeight: '600', color: NAVY },

  sectionTitle: {
    fontSize: 11, color: '#9CA3AF', fontWeight: '700',
    letterSpacing: 0.6, marginTop: 18, marginBottom: 8,
  },

  infoCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  infoLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', flex: 2, textAlign: 'right' },

  perfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  perfCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, flex: 1, minWidth: '44%', alignItems: 'center',
  },
  perfValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  perfLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  moduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  moduleRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  moduleTitle: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  moduleStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  moduleStatusDone: { backgroundColor: '#D1FAE5' },
  moduleStatusPending: { backgroundColor: '#FEF3C7' },
  moduleStatusText: { fontSize: 11, fontWeight: '600' },
  moduleStatusTextDone: { color: '#059669' },
  moduleStatusTextPending: { color: '#D97706' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  badgeIcon: { fontSize: 20 },
  badgeName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  badgeDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  emptySection: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#9CA3AF' },

  toggleBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  deactivateBtn: { backgroundColor: '#FEE2E2' },
  activateBtn: { backgroundColor: '#D1FAE5' },
  toggleBtnText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
})
