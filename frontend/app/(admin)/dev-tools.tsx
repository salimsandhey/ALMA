import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'

if (!__DEV__) {
  throw new Error('dev-tools screen must never be bundled in production')
}

const NAVY = '#093373'
const GOLD = '#F6B80D'

// lessonId → word → emoji
type EmojiMap = Record<string, Record<string, string>>

export default function DevToolsScreen() {
  const router = useRouter()
  const [emojis, setEmojis] = useState<EmojiMap>({})
  const [editing, setEditing] = useState<{ lessonId: string; word: string; value: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dev-wm-emojis'],
    queryFn: async () => (await api.get('/api/dev/word-match-emojis')).data,
  })

  // Seed local state from server defaults once loaded
  useEffect(() => {
    if (!data?.preview) return
    const map: EmojiMap = {}
    data.preview.forEach((lesson: any) => {
      map[lesson.id] = {}
      lesson.cards.forEach((card: any) => {
        map[lesson.id][card.word] = card.newEmoji
      })
    })
    setEmojis(map)
  }, [data])

  const apply = useMutation({
    mutationFn: () => api.post('/api/dev/word-match-emojis', { overrides: emojis }),
    onSuccess: (res) => Alert.alert('✅ Done', `Updated ${res.data.updated} word match lessons.`),
    onError: () => Alert.alert('Error', 'Failed to apply emojis.'),
  })

  const getEmoji = (lessonId: string, word: string) =>
    emojis[lessonId]?.[word] ?? '❓'

  const saveEdit = () => {
    if (!editing) return
    setEmojis((prev) => ({
      ...prev,
      [editing.lessonId]: { ...(prev[editing.lessonId] ?? {}), [editing.word]: editing.value },
    }))
    setEditing(null)
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>DEV ONLY</Text>
          <Text style={s.headerTitle}>Dev Tools</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.section}>
          <Text style={s.sectionTitle}>Word Match — Set Emojis</Text>
          <Text style={s.sectionDesc}>
            Tap any emoji to change it, then hit Apply to write all changes to the DB in one go.
          </Text>

          <TouchableOpacity
            style={[s.applyBtn, apply.isPending && { opacity: 0.6 }]}
            onPress={() => apply.mutate()}
            disabled={apply.isPending}
          >
            {apply.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.applyBtnText}>⚡ Apply All Emojis</Text>
            }
          </TouchableOpacity>

          {isLoading && <ActivityIndicator color={NAVY} style={{ marginTop: 20 }} />}

          {data?.preview?.map((lesson: any) => (
            <View key={lesson.id} style={s.lessonCard}>
              <Text style={s.lessonModule}>{lesson.module}</Text>
              <Text style={s.lessonTitle}>{lesson.lesson}</Text>
              <View style={s.cardGrid}>
                {lesson.cards.map((card: any) => {
                  const emoji = getEmoji(lesson.id, card.word)
                  return (
                    <TouchableOpacity
                      key={card.word}
                      style={s.cardItem}
                      onPress={() => setEditing({ lessonId: lesson.id, word: card.word, value: emoji })}
                      activeOpacity={0.7}
                    >
                      <Text style={s.cardEmoji}>{emoji}</Text>
                      <Text style={s.cardWord} numberOfLines={1}>{card.word}</Text>
                      <Text style={s.editHint}>tap to edit</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Emoji edit modal */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Edit emoji for</Text>
            <Text style={s.modalWord}>"{editing?.word}"</Text>

            <Text style={s.modalPreview}>{editing?.value || '❓'}</Text>

            <TextInput
              style={s.modalInput}
              value={editing?.value ?? ''}
              onChangeText={(v) => setEditing((e) => e ? { ...e, value: v } : null)}
              placeholder="Paste emoji here"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setEditing(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={saveEdit}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerSub:   { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  scroll:       { padding: 16, paddingBottom: 60 },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: NAVY, marginBottom: 4 },
  sectionDesc:  { fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 18 },

  applyBtn:     { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  lessonCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  lessonModule: { fontSize: 10, color: GOLD, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  lessonTitle:  { fontSize: 13, fontWeight: '700', color: NAVY, marginBottom: 10 },

  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardItem: { alignItems: 'center', width: '30%', backgroundColor: '#F0F4FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  cardEmoji: { fontSize: 26, marginBottom: 4 },
  cardWord:  { fontSize: 10, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  editHint:  { fontSize: 8, color: '#93C5FD', marginTop: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle:   { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  modalWord:    { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 16 },
  modalPreview: { fontSize: 52, marginBottom: 16 },
  modalInput:   { width: '100%', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 28, textAlign: 'center', marginBottom: 20, color: '#1F2937' },
  modalBtns:    { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  modalSave:    { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: NAVY, alignItems: 'center' },
  modalSaveText:   { fontSize: 14, color: '#fff', fontWeight: '700' },
})
