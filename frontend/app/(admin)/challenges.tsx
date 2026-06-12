import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, ScrollView, Alert, Switch,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { NAVY, GOLD, BG, CARD, RED } from '../../constants/colors'

type Challenge = {
  id: string
  question: string
  sampleAnswer: string
  keywords: string[]
  xpReward: number
  isActive: boolean
  orderIndex: number
  attemptCount: number
  createdAt: string
}

export default function ChallengesScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()
  const { width: screenWidth } = useWindowDimensions()

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Challenge | null>(null)

  const [question, setQuestion]       = useState('')
  const [sampleAnswer, setSampleAnswer] = useState('')
  const [keywordsText, setKeywordsText] = useState('')  // comma-separated
  const [xpReward, setXpReward]       = useState('10')
  const [isActive, setIsActive]       = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: async () => (await api.get('/api/admin/challenges')).data as { total: number; challenges: Challenge[] },
  })

  const resetForm = () => {
    setQuestion(''); setSampleAnswer(''); setKeywordsText(''); setXpReward('10'); setIsActive(true); setEditing(null)
  }

  const openCreate = () => { resetForm(); setModalVisible(true) }

  const openEdit = (c: Challenge) => {
    setEditing(c)
    setQuestion(c.question)
    setSampleAnswer(c.sampleAnswer)
    setKeywordsText(c.keywords.join(', '))
    setXpReward(String(c.xpReward))
    setIsActive(c.isActive)
    setModalVisible(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const keywords = keywordsText.split(',').map((k) => k.trim()).filter(Boolean)
      const payload = { question: question.trim(), sampleAnswer: sampleAnswer.trim(), keywords, xpReward: Number(xpReward) || 10, isActive }
      if (editing) await api.patch(`/api/admin/challenges/${editing.id}`, payload)
      else await api.post('/api/admin/challenges', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] })
      setModalVisible(false); resetForm()
    },
    onError: () => Alert.alert('Error', 'Failed to save challenge.'),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/challenges/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-challenges'] }),
  })

  const confirmDelete = (c: Challenge) =>
    Alert.alert('Delete Challenge', `Delete this challenge?\n"${c.question.slice(0, 60)}..."`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(c.id) },
    ])

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/admin/challenges/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-challenges'] }),
  })

  const isFormValid = question.trim().length >= 5 && sampleAnswer.trim().length >= 2 && keywordsText.trim().length > 0

  const renderItem = ({ item: c }: { item: Challenge }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>#{c.orderIndex}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.question} numberOfLines={2}>{c.question}</Text>
          <Text style={styles.meta}>{c.attemptCount} attempts · {c.xpReward} XP</Text>
        </View>
        <Switch
          value={c.isActive}
          onValueChange={(v) => toggleActive.mutate({ id: c.id, isActive: v })}
          trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
          thumbColor={c.isActive ? NAVY : '#9CA3AF'}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], flexShrink: 0 }}
        />
      </View>

      <View style={styles.sampleRow}>
        <Text style={styles.sampleLabel}>Sample: </Text>
        <Text style={styles.sampleText} numberOfLines={2}>{c.sampleAnswer}</Text>
      </View>

      <View style={styles.keywordsRow}>
        {c.keywords.slice(0, 5).map((k) => (
          <View key={k} style={[styles.keywordChip, { maxWidth: screenWidth * 0.4 }]}>
            <Text style={styles.keywordText} numberOfLines={1}>{k}</Text>
          </View>
        ))}
        {c.keywords.length > 5 && (
          <Text style={styles.moreKeywords}>+{c.keywords.length - 5}</Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(c)}>
          <Ionicons name="pencil-outline" size={14} color="#FFF" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(c)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={RED} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Daily Challenges</Text>
        </View>
        <TouchableOpacity onPress={async () => { await deleteToken(); clearAuth(); router.replace('/(auth)/login') }} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>{data?.total ?? 0} challenges</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>New Challenge</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
        : <FlatList
            data={data?.challenges ?? []}
            keyExtractor={(c) => c.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={<Text style={styles.empty}>No challenges yet. Create the first one.</Text>}
          />
      }

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => { setModalVisible(false); resetForm() }} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{editing ? 'Edit Challenge' : 'New Challenge'}</Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); resetForm() }}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>QUESTION</Text>
                <TextInput
                  style={[styles.input, { minHeight: 70 }]}
                  placeholder="e.g. Describe your favourite meal and why you like it."
                  placeholderTextColor="#9CA3AF"
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.fieldLabel}>SAMPLE ANSWER</Text>
                <Text style={styles.fieldHint}>This is shown to students as a reference after they answer.</Text>
                <TextInput
                  style={[styles.input, { minHeight: 90 }]}
                  placeholder="e.g. My favourite meal is rice and chicken because it is healthy and tasty."
                  placeholderTextColor="#9CA3AF"
                  value={sampleAnswer}
                  onChangeText={setSampleAnswer}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.fieldLabel}>KEYWORDS</Text>
                <Text style={styles.fieldHint}>Comma-separated. AI checks if student's answer includes these.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. meal, favourite, healthy, tasty"
                  placeholderTextColor="#9CA3AF"
                  value={keywordsText}
                  onChangeText={setKeywordsText}
                  autoCapitalize="none"
                />

                {/* Keyword preview */}
                {keywordsText.trim().length > 0 && (
                  <View style={styles.keywordsPreview}>
                    {keywordsText.split(',').map((k) => k.trim()).filter(Boolean).map((k) => (
                      <View key={k} style={[styles.keywordChip, { maxWidth: screenWidth * 0.4 }]}>
                        <Text style={styles.keywordText} numberOfLines={1}>{k}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>XP REWARD</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10"
                      placeholderTextColor="#9CA3AF"
                      value={xpReward}
                      onChangeText={setXpReward}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.activeToggle}>
                    <Text style={styles.fieldLabel}>ACTIVE</Text>
                    <Switch
                      value={isActive}
                      onValueChange={setIsActive}
                      trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                      thumbColor={isActive ? NAVY : '#9CA3AF'}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
                  disabled={!isFormValid || save.isPending}
                  onPress={() => save.mutate()}
                >
                  {save.isPending
                    ? <ActivityIndicator size="small" color={NAVY} />
                    : <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Create Challenge'}</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  toolbarText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: NAVY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  card: { backgroundColor: CARD, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  orderBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 32, alignItems: 'center' },
  orderText: { fontSize: 12, fontWeight: '700', color: NAVY },
  question: { fontSize: 14, fontWeight: '600', color: '#1F2937', lineHeight: 20 },
  meta: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  sampleRow: { flexDirection: 'row', marginBottom: 10 },
  sampleLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  sampleText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  keywordChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  keywordText: { fontSize: 11, color: NAVY, fontWeight: '500' },
  moreKeywords: { fontSize: 11, color: '#9CA3AF', alignSelf: 'center' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  deleteBtn: { padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', position: 'relative' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  fieldLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 6, marginTop: -4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 4 },
  keywordsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  rowFields: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  activeToggle: { alignItems: 'center', paddingBottom: 6 },
  saveBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },
})
