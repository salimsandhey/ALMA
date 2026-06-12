import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { NAVY, GOLD, BG, CARD } from '../../constants/colors'

type ContentItem = {
  id: string
  type: 'VIDEO' | 'ARTICLE'
  title: string
  description: string
  url: string
  xpReward: number
  isPublished: boolean
  questions: { id: string; question: string; expectedAnswer: string; keywords: string[] }[]
}

type QuestionForm = { question: string; expectedAnswer: string }

const defaultQuestions: QuestionForm[] = [
  { question: '', expectedAnswer: '' },
  { question: '', expectedAnswer: '' },
  { question: '', expectedAnswer: '' },
]

export default function ContentScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)

  const [form, setForm] = useState({
    title: '',
    url: '',
    type: 'VIDEO' as 'VIDEO' | 'ARTICLE',
    description: '',
  })
  const [questions, setQuestions] = useState<QuestionForm[]>(defaultQuestions)

  const handleLogout = async () => {
    await deleteToken()
    clearAuth()
    router.replace('/(auth)/login')
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-entertainment'],
    queryFn: async () => {
      const res = await api.get('/api/admin/entertainment')
      return res.data as { total: number; items: ContentItem[] }
    },
  })

  const resetForm = () => {
    setForm({ title: '', url: '', type: 'VIDEO', description: '' })
    setQuestions(defaultQuestions)
    setEditItem(null)
  }

  const openAdd = () => {
    resetForm()
    setAddModalVisible(true)
  }

  const openEdit = (item: ContentItem) => {
    setEditItem(item)
    setForm({ title: item.title, url: item.url, type: item.type, description: item.description })
    const qs = item.questions.map((q) => ({ question: q.question, expectedAnswer: q.expectedAnswer }))
    while (qs.length < 3) qs.push({ question: '', expectedAnswer: '' })
    setQuestions(qs)
    setAddModalVisible(true)
  }

  const createContent = useMutation({
    mutationFn: async () => {
      const validQs = questions.filter((q) => q.question.trim() && q.expectedAnswer.trim())
      const payload = {
        ...form,
        questions: validQs.map((q) => ({ ...q, keywords: [] })),
      }
      if (editItem) {
        await api.patch(`/api/admin/entertainment/${editItem.id}`, payload)
      } else {
        await api.post('/api/admin/entertainment', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-entertainment'] })
      setAddModalVisible(false)
      resetForm()
    },
    onError: () => Alert.alert('Error', 'Failed to save content. Check the URL and try again.'),
  })

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin/entertainment/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-entertainment'] }),
  })

  const confirmDelete = (item: ContentItem) => {
    Alert.alert('Delete Content', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteContent.mutate(item.id) },
    ])
  }

  const updateQuestion = (idx: number, field: 'question' | 'expectedAnswer', val: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: val } : q)))
  }

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.typeIcon}>
          <Ionicons
            name={item.type === 'VIDEO' ? 'videocam-outline' : 'book-outline'}
            size={20}
            color="#6B7280"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardUrl} numberOfLines={1} ellipsizeMode="tail">{item.url}</Text>
          <View style={[styles.typeBadge, item.type === 'VIDEO' ? styles.videoBadge : styles.articleBadge]}>
            <Text style={styles.typeBadgeText}>{item.type === 'VIDEO' ? 'Video' : 'Article'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={16} color={NAVY} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const isFormValid = form.title.trim().length > 0 && form.url.trim().length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Content</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View>
          <Text style={styles.sectionTitle}>Explore Library</Text>
          <Text style={styles.sectionSub}>{data?.total ?? 0} live contents</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={16} color={NAVY} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listHeader}>CURRENTLY UPLOADED ({data?.total ?? 0})</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />}
          ListEmptyComponent={<Text style={styles.empty}>No content yet. Tap + Add to create.</Text>}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setAddModalVisible(false); resetForm() }}>
            <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editItem ? 'Edit Content' : 'New Content'}</Text>
                <TouchableOpacity onPress={() => { setAddModalVisible(false); resetForm() }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  placeholderTextColor="#9CA3AF"
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="URL (https://...)"
                  placeholderTextColor="#9CA3AF"
                  value={form.url}
                  onChangeText={(v) => setForm((f) => ({ ...f, url: v }))}
                  keyboardType="url"
                  autoCapitalize="none"
                />

                {/* Type Selector */}
                <View style={styles.typeRow}>
                  {(['VIDEO', 'ARTICLE'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeOption, form.type === t && styles.typeOptionActive]}
                      onPress={() => setForm((f) => ({ ...f, type: t }))}
                    >
                      <Ionicons
                        name={t === 'VIDEO' ? 'videocam-outline' : 'book-outline'}
                        size={16}
                        color={form.type === t ? NAVY : '#6B7280'}
                      />
                      <Text style={[styles.typeOptionText, form.type === t && styles.typeOptionTextActive]}>
                        {t === 'VIDEO' ? 'Video' : 'Article'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Description (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                />

                <Text style={styles.quizLabel}>QUIZ QUESTIONS (UP TO 3)</Text>

                {questions.map((q, i) => (
                  <View key={i} style={styles.questionBlock}>
                    <Text style={styles.questionNum}>Question {i + 1}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Question ${i + 1}`}
                      placeholderTextColor="#9CA3AF"
                      value={q.question}
                      onChangeText={(v) => updateQuestion(i, 'question', v)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Answer"
                      placeholderTextColor="#9CA3AF"
                      value={q.expectedAnswer}
                      onChangeText={(v) => updateQuestion(i, 'expectedAnswer', v)}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
                  disabled={!isFormValid || createContent.isPending}
                  onPress={() => createContent.mutate()}
                >
                  {createContent.isPending ? (
                    <ActivityIndicator size="small" color={NAVY} />
                  ) : (
                    <Text style={styles.saveBtnText}>{editItem ? 'Save Changes' : 'Add to Library'}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

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
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  sectionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: CARD, borderWidth: 1, borderColor: NAVY,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: NAVY },
  listHeader: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: CARD, paddingVertical: 14, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  cardUrl: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  videoBadge: { backgroundColor: '#DBEAFE' },
  articleBadge: { backgroundColor: '#F3F4F6' },
  typeBadgeText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  cardActions: { flexDirection: 'column', gap: 4, paddingTop: 0, alignItems: 'flex-end', flexShrink: 0, width: 40 },
  actionBtn: { padding: 6 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: '#1F2937', marginBottom: 10,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10,
  },
  typeOptionActive: { borderColor: NAVY, backgroundColor: '#EFF6FF' },
  typeOptionText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  typeOptionTextActive: { color: NAVY, fontWeight: '600' },
  quizLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
  questionBlock: { marginBottom: 8 },
  questionNum: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  saveBtn: { backgroundColor: GOLD, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },
})
