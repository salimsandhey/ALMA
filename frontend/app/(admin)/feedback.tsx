import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'

const NAVY = '#093373'
const GOLD = '#F5A623'
const BG = '#F3F4F6'
const CARD = '#FFFFFF'

type FeedbackItem = {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  rating: number
  topic: string | null
  comment: string | null
  adminReply: string | null
  adminRepliedAt: string | null
  createdAt: string
  needsReply: boolean
}

const RATING_EMOJI: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊',
}

const TOPIC_COLORS: Record<string, string> = {
  'General': '#E5E7EB',
  'Lesson Content': '#DBEAFE',
  'AI Coach': '#EDE9FE',
  'Technical Issue': '#FEE2E2',
  'Suggestion': '#D1FAE5',
}

export default function FeedbackScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [replyModalItem, setReplyModalItem] = useState<FeedbackItem | null>(null)
  const [replyText, setReplyText] = useState('')

  const handleLogout = async () => {
    await deleteToken()
    clearAuth()
    router.replace('/(auth)/login')
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const res = await api.get('/api/admin/feedback')
      return res.data as { total: number; unansweredCount: number; items: FeedbackItem[] }
    },
  })

  const sendReply = useMutation({
    mutationFn: async ({ id, reply, isEdit }: { id: string; reply: string; isEdit: boolean }) => {
      if (isEdit) {
        await api.patch(`/api/admin/feedback/${id}/reply`, { reply })
      } else {
        await api.post(`/api/admin/feedback/${id}/reply`, { reply })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      setReplyModalItem(null)
      setReplyText('')
    },
  })

  const openReply = (item: FeedbackItem) => {
    setReplyModalItem(item)
    setReplyText(item.adminReply ?? '')
  }

  const renderItem = ({ item }: { item: FeedbackItem }) => {
    const topicColor = TOPIC_COLORS[item.topic ?? 'General'] ?? '#E5E7EB'
    return (
      <View style={[styles.card, item.needsReply ? styles.cardNeedsReply : styles.cardReplied]}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={styles.senderName}>{item.displayName}</Text>
          {item.needsReply && (
            <View style={styles.needsReplyBadge}>
              <Text style={styles.needsReplyText}>Needs Reply</Text>
            </View>
          )}
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.topicBadge, { backgroundColor: topicColor }]}>
            <Text style={styles.topicText}>{item.topic ?? 'General'}</Text>
          </View>
          <Text style={styles.ratingEmoji}>{RATING_EMOJI[item.rating] ?? '😐'}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Message */}
        {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}

        {/* Admin reply box */}
        {item.adminReply ? (
          <View style={styles.replyBox}>
            <Text style={styles.replyLabel}>Your Reply</Text>
            <Text style={styles.replyText}>{item.adminReply}</Text>
          </View>
        ) : null}

        {/* Reply / Edit Reply button */}
        <TouchableOpacity style={styles.replyBtn} onPress={() => openReply(item)}>
          <Ionicons name="arrow-undo-outline" size={14} color={NAVY} />
          <Text style={styles.replyBtnText}>{item.adminReply ? 'Edit Reply' : 'Reply'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>Student Feedback</Text>
        <Text style={styles.subMeta}>
          {data?.total ?? 0} messages · {data?.unansweredCount ?? 0} unanswered
        </Text>
      </View>

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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No feedback yet.</Text>}
        />
      )}

      {/* Reply Modal */}
      <Modal visible={!!replyModalItem} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => { setReplyModalItem(null); setReplyText('') }}
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reply to Feedback 💬</Text>
                <TouchableOpacity onPress={() => setReplyModalItem(null)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalStudent}>Student: {replyModalItem?.displayName}</Text>

              {replyModalItem?.comment ? (
                <View style={styles.originalMsg}>
                  <Text style={styles.originalText}>{replyModalItem.comment}</Text>
                </View>
              ) : (
                <View style={[styles.originalMsg, { borderStyle: 'dashed' }]}>
                  <Text style={[styles.originalText, { color: '#9CA3AF' }]}>No message provided.</Text>
                </View>
              )}

              <TextInput
                style={styles.replyInput}
                placeholder="Write your reply here..."
                placeholderTextColor="#9CA3AF"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.sendBtn, replyText.trim().length === 0 && styles.sendBtnDisabled]}
                disabled={replyText.trim().length === 0 || sendReply.isPending}
                onPress={() =>
                  sendReply.mutate({
                    id: replyModalItem!.id,
                    reply: replyText.trim(),
                    isEdit: !!replyModalItem?.adminReply,
                  })
                }
              >
                {sendReply.isPending ? (
                  <ActivityIndicator size="small" color={NAVY} />
                ) : (
                  <Text style={styles.sendBtnText}>Send Reply</Text>
                )}
              </TouchableOpacity>
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
  header: {
    backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },
  subHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  subMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },

  // Base card — shadow only, no border
  card: {
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  // Needs reply — yellow border replaces shadow so they don't compete
  cardNeedsReply: {
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: GOLD,
  },
  // Replied — same as base, no extra border
  cardReplied: {
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  senderName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  // "Needs Reply" badge — gold bg, navy text
  needsReplyBadge: { backgroundColor: GOLD, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  needsReplyText: { fontSize: 11, color: NAVY, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  topicBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  topicText: { fontSize: 11, color: '#374151', fontWeight: '500' },
  ratingEmoji: { fontSize: 16 },
  date: { fontSize: 11, color: '#9CA3AF' },

  comment: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },

  // Admin reply shown on card — no border, just bg colour contrast
  replyBox: {
    backgroundColor: '#F3F4F6', borderRadius: 10,
    padding: 12, marginBottom: 12,
  },
  replyLabel: { fontSize: 11, fontWeight: '700', color: NAVY, marginBottom: 5 },
  replyText: { fontSize: 13, color: '#374151', lineHeight: 18 },

  // Reply / Edit Reply — outlined button
  replyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: CARD,
  },
  replyBtnText: { fontSize: 13, color: NAVY, fontWeight: '600' },

  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', position: 'relative' },
  modalSheet: {
    backgroundColor: CARD, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalStudent: { fontSize: 13, color: '#6B7280', marginBottom: 10 },

  // Original message box in modal — bordered
  originalMsg: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, marginBottom: 14,
  },
  originalText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  replyInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1F2937', minHeight: 110,
    marginBottom: 16, textAlignVertical: 'top',
  },
  sendBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },
})
