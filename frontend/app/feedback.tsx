import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { NAVY, GOLD, BG, GREY } from '../constants/colors'

const EMOJIS = ['😞', '😐', '🙂', '😊', '🤩']
const TOPICS = ['General', 'Lesson Content', 'AI Coach', 'Technical Issue', 'Suggestion']

type FeedbackItem = {
  id: string
  rating: number
  topic: string | null
  comment: string | null
  createdAt: string
  adminReply: string | null
  adminRepliedAt: string | null
}

export default function FeedbackScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'send' | 'mine'>('send')
  const [rating, setRating] = useState(0)
  const [topic, setTopic] = useState('General')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data: myFeedback, isLoading: loadingMine } = useQuery<{ feedbacks: FeedbackItem[]; hasUnreadReply: boolean }>({
    queryKey: ['my-feedback'],
    queryFn: () => api.get('/api/feedback').then((r) => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post('/api/feedback', { rating, topic, comment: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] })
      setSubmitted(true)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Could not submit feedback. Please try again.'
      Alert.alert('Error', msg)
    },
  })

  const canSubmit = rating > 0 && message.trim().length > 0

  // Thank you screen
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.thankYouContainer}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={32} color="#22C55E" />
          </View>
          <Text style={styles.thankYouTitle}>Thank you!</Text>
          <Text style={styles.thankYouSub}>Your feedback helps us improve ALMA for everyone.</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.goldBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'send' && styles.tabActive]}
          onPress={() => setTab('send')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, tab === 'send' && styles.tabTextActive]}>Send Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
          activeOpacity={0.7}
        >
          <View style={styles.tabInner}>
            <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Feedback</Text>
            {myFeedback?.hasUnreadReply && tab !== 'mine' && (
              <View style={styles.replyDot} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {tab === 'send' ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Emoji rating */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How's your experience?</Text>
            <View style={styles.emojiRow}>
              {EMOJIS.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i + 1)}
                  activeOpacity={0.7}
                  style={styles.emojiBtn}
                >
                  <Text style={[styles.emoji, rating === i + 1 && styles.emojiActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Topic */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Topic</Text>
            <View style={styles.topicWrap}>
              {TOPICS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.topicChip, topic === t && styles.topicChipActive]}
                  onPress={() => setTopic(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.topicChipText, topic === t && styles.topicChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what's working, what could be better, or report a problem..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={canSubmit ? () => submitMutation.mutate() : undefined}
            disabled={submitMutation.isPending}
            activeOpacity={0.85}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={16} color={canSubmit ? '#FFFFFF' : GREY} />
                <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextDisabled]}>
                  Submit Feedback
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {loadingMine ? (
            <ActivityIndicator color={NAVY} style={{ marginTop: 60 }} />
          ) : !myFeedback?.feedbacks?.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No feedback sent yet.</Text>
              <TouchableOpacity onPress={() => setTab('send')} activeOpacity={0.7}>
                <Text style={styles.emptyLink}>Send your first feedback →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myFeedback.feedbacks.map((fb) => (
              <View key={fb.id} style={[styles.feedbackCard, fb.adminReply && styles.feedbackCardReplied]}>
                <View style={styles.feedbackCardTop}>
                  <Text style={styles.feedbackEmoji}>{EMOJIS[fb.rating - 1]}</Text>
                  {fb.topic && (
                    <View style={styles.feedbackTopicBadge}>
                      <Text style={styles.feedbackTopicText}>{fb.topic}</Text>
                    </View>
                  )}
                  <Text style={styles.feedbackDate}>
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {fb.comment && <Text style={styles.feedbackComment}>{fb.comment}</Text>}
                {fb.adminReply && (
                  <View style={styles.adminReplyBox}>
                    <View style={styles.adminReplyHeader}>
                      <Ionicons name="shield-checkmark-outline" size={13} color={NAVY} />
                      <Text style={styles.adminReplyLabel}>ALMA Team replied</Text>
                      {fb.adminRepliedAt && (
                        <Text style={styles.adminReplyDate}>
                          {new Date(fb.adminRepliedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.adminReplyText}>{fb.adminReply}</Text>
                  </View>
                )}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  tabsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: NAVY },
  tabText: { fontSize: 14, fontWeight: '500', color: GREY },
  tabTextActive: { color: NAVY, fontWeight: '700' },
  body: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  // Emoji rating
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emojiBtn: { padding: 4 },
  emoji: { fontSize: 32, opacity: 0.4 },
  emojiActive: { opacity: 1 },
  // Topic chips
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#F9FAFB',
  },
  topicChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  topicChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  topicChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  // Message
  messageInput: {
    minHeight: 120, fontSize: 14, color: '#111827',
    lineHeight: 20, paddingTop: 4,
  },
  // Submit
  submitBtn: {
    backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#E5E7EB' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  submitBtnTextDisabled: { color: GREY },
  // Thank you
  thankYouContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12,
  },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  thankYouTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  thankYouSub: { fontSize: 14, color: GREY, textAlign: 'center', lineHeight: 20 },
  goldBtn: {
    backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 40, marginTop: 12,
  },
  goldBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: GREY, fontWeight: '500' },
  emptyLink: { fontSize: 14, color: NAVY, fontWeight: '700' },
  // My feedback cards
  feedbackCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    gap: 8, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 1,
  },
  feedbackCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackEmoji: { fontSize: 22 },
  feedbackTopicBadge: {
    backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  feedbackTopicText: { fontSize: 11, color: NAVY, fontWeight: '600' },
  feedbackDate: { marginLeft: 'auto', fontSize: 12, color: GREY },
  feedbackComment: { fontSize: 14, color: '#374151', lineHeight: 20 },
  feedbackCardReplied: { borderLeftWidth: 3, borderLeftColor: NAVY },
  adminReplyBox: {
    marginTop: 10, backgroundColor: '#EFF6FF',
    borderRadius: 10, padding: 12,
  },
  adminReplyHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  adminReplyLabel: { fontSize: 11, fontWeight: '700', color: NAVY, flex: 1 },
  adminReplyDate: { fontSize: 11, color: '#6B7280' },
  adminReplyText: { fontSize: 13, color: '#1E3A5F', lineHeight: 18 },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD,
  },
})
