import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, ScrollView, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { deleteToken } from '../../lib/storage'
import { NAVY, GOLD, BG, CARD, RED } from '../../constants/colors'

type Song = {
  id: string
  title: string
  artist: string
  genre: string
  emoji: string
  youtubeUrl: string
  lyrics: string[]
  isPublished: boolean
  orderIndex: number
  createdAt: string
}

export default function SongsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Song | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [title, setTitle]           = useState('')
  const [artist, setArtist]         = useState('')
  const [genre, setGenre]           = useState('')
  const [emoji, setEmoji]           = useState('🎵')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [lyricsText, setLyricsText] = useState('')  // one lyric line per line
  const [isPublished, setIsPublished] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-songs'],
    queryFn: async () => (await api.get('/api/admin/songs')).data as { total: number; songs: Song[] },
  })

  const resetForm = () => {
    setTitle(''); setArtist(''); setGenre(''); setEmoji('🎵')
    setYoutubeUrl(''); setLyricsText(''); setIsPublished(true); setEditing(null)
  }

  const openCreate = () => { resetForm(); setModalVisible(true) }

  const openEdit = (s: Song) => {
    setEditing(s)
    setTitle(s.title); setArtist(s.artist); setGenre(s.genre); setEmoji(s.emoji)
    setYoutubeUrl(s.youtubeUrl); setLyricsText(s.lyrics.join('\n')); setIsPublished(s.isPublished)
    setModalVisible(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const lyrics = lyricsText.split('\n').map((l) => l.trim()).filter(Boolean)
      const payload = { title: title.trim(), artist: artist.trim(), genre: genre.trim(), emoji, youtubeUrl: youtubeUrl.trim(), lyrics, isPublished }
      if (editing) await api.patch(`/api/admin/songs/${editing.id}`, payload)
      else await api.post('/api/admin/songs', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-songs'] })
      setModalVisible(false); resetForm()
    },
    onError: () => Alert.alert('Error', 'Failed to save song. Check the YouTube URL.'),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/songs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-songs'] }),
  })

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/api/admin/songs/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-songs'] }),
  })

  const confirmDelete = (s: Song) =>
    Alert.alert('Delete Song', `Delete "${s.title}" by ${s.artist}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(s.id) },
    ])

  const isFormValid = title.trim().length > 0 && artist.trim().length > 0 && youtubeUrl.trim().startsWith('http')

  const renderItem = ({ item: s }: { item: Song }) => {
    const expanded = expandedId === s.id
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : s.id)} activeOpacity={0.8}>
          <Text style={styles.songEmoji}>{s.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle} numberOfLines={1}>{s.title}</Text>
            <Text style={styles.songMeta}>{s.artist} · {s.genre} · {s.lyrics.length} lines</Text>
          </View>
          <Switch
            value={s.isPublished}
            onValueChange={(v) => togglePublish.mutate({ id: s.id, isPublished: v })}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={s.isPublished ? NAVY : '#9CA3AF'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedDivider} />

            {/* YouTube URL */}
            <Text style={styles.expandedLabel}>YouTube URL</Text>
            <Text style={styles.expandedValue} numberOfLines={1} ellipsizeMode="middle">{s.youtubeUrl}</Text>

            {/* Lyrics preview */}
            <Text style={[styles.expandedLabel, { marginTop: 10 }]}>Lyrics ({s.lyrics.length} lines)</Text>
            {s.lyrics.slice(0, 4).map((line, i) => (
              <Text key={i} style={styles.lyricLine}>{line}</Text>
            ))}
            {s.lyrics.length > 4 && (
              <Text style={styles.moreLyrics}>+ {s.lyrics.length - 4} more lines...</Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(s)}>
                <Ionicons name="pencil-outline" size={14} color="#FFF" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(s)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={RED} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>ALMA PLATFORM</Text>
          <Text style={styles.headerTitle}>Songs / Karaoke</Text>
        </View>
        <TouchableOpacity onPress={async () => { await deleteToken(); clearAuth(); router.replace('/(auth)/login') }} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>{data?.total ?? 0} songs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>New Song</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
        : <FlatList
            data={data?.songs ?? []}
            keyExtractor={(s) => s.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={<Text style={styles.empty}>No songs yet. Add the first one.</Text>}
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
                  <Text style={styles.modalTitle}>{editing ? 'Edit Song' : 'New Song'}</Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); resetForm() }}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>SONG INFO</Text>
                <View style={styles.emojiTitleRow}>
                  <TextInput
                    style={[styles.input, styles.emojiInput]}
                    placeholder="🎵"
                    value={emoji}
                    onChangeText={setEmoji}
                    textAlign="center"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Song title"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <TextInput style={styles.input} placeholder="Artist name" placeholderTextColor="#9CA3AF" value={artist} onChangeText={setArtist} />
                <TextInput style={styles.input} placeholder="Genre (e.g. Pop, Folk, Jazz)" placeholderTextColor="#9CA3AF" value={genre} onChangeText={setGenre} />

                <Text style={styles.fieldLabel}>YOUTUBE URL</Text>
                <Text style={styles.fieldHint}>Paste the full YouTube video URL for the karaoke version.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor="#9CA3AF"
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />

                <Text style={styles.fieldLabel}>LYRICS</Text>
                <Text style={styles.fieldHint}>One lyric line per line. Students follow along during karaoke.</Text>
                <TextInput
                  style={[styles.input, styles.lyricsInput]}
                  placeholder={'Hello, is it me you\'re looking for?\nI can see it in your eyes...\n...'}
                  placeholderTextColor="#9CA3AF"
                  value={lyricsText}
                  onChangeText={setLyricsText}
                  multiline
                  textAlignVertical="top"
                />

                {lyricsText.trim().length > 0 && (
                  <Text style={styles.lyricsCount}>
                    {lyricsText.split('\n').filter((l) => l.trim().length > 0).length} lyric lines
                  </Text>
                )}

                <View style={styles.publishRow}>
                  <Text style={styles.fieldLabel}>PUBLISHED</Text>
                  <Switch
                    value={isPublished}
                    onValueChange={setIsPublished}
                    trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                    thumbColor={isPublished ? NAVY : '#9CA3AF'}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
                  disabled={!isFormValid || save.isPending}
                  onPress={() => save.mutate()}
                >
                  {save.isPending
                    ? <ActivityIndicator size="small" color={NAVY} />
                    : <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Add Song'}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  songEmoji: { fontSize: 28 },
  songTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  songMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  expandedSection: { marginTop: 12 },
  expandedDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  expandedLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.4, marginBottom: 4 },
  expandedValue: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  lyricLine: { fontSize: 13, color: '#374151', paddingVertical: 2 },
  moreLyrics: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
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
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 8 },
  emojiTitleRow: { flexDirection: 'row', gap: 8 },
  emojiInput: { width: 48, flexShrink: 0, fontSize: 24 },
  lyricsInput: { minHeight: 100, maxHeight: 200, fontFamily: 'monospace' },
  lyricsCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: -4, marginBottom: 8 },
  publishRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  saveBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: NAVY },
})
