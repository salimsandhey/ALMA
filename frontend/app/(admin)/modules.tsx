import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, Alert, Switch, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
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
const GREEN = '#059669'
const RED = '#EF4444'

type GameType = 'FLASHCARD' | 'WORD_MATCH' | 'FILL_BLANK' | 'TRUE_FALSE' | 'DIALOGUE' | 'IMAGE_SPEAK'
type View = 'list' | 'module' | 'lesson'

type ModuleItem = {
  id: string; title: string; description: string; imageUrl: string | null
  orderIndex: number; isPublished: boolean; lessonCount: number; avgCompletion: number
}
type LessonItem = {
  id: string; title: string; gameType: GameType; orderIndex: number; xpReward: number; content: any
}
type FlashCard      = { id: string; word: string; translation: string; imageUrl: string; targetWord: string }
type WordMatchCard  = { id: string; emoji: string; correctWord: string; distractors: string[] }
type FillBlankCard  = { id: string; sentenceTemplate: string; correctAnswer: string; hint: string; distractors: string[] }
type TrueFalseCard  = { id: string; statement: string; isTrue: boolean; explanation: string }
type DialogueTurn   = { speaker: 'GUEST' | 'USER'; text: string; expectedResponse: string }
type ImageSpeakCard = { id: string; imageUrl: string; targetWord: string; hint: string }

const GAME_TYPE_INFO = [
  { key: 'FLASHCARD'   as GameType, label: 'Flashcard',        desc: 'Show image + word, student speaks it',   emoji: '🃏' },
  { key: 'WORD_MATCH'  as GameType, label: 'Word Match',        desc: 'Match emoji to the correct word',        emoji: '🎯' },
  { key: 'FILL_BLANK'  as GameType, label: 'Fill in the Blank', desc: 'Complete sentence with missing word',    emoji: '✏️' },
  { key: 'TRUE_FALSE'  as GameType, label: 'True / False',      desc: 'Quick statement quiz',                   emoji: '✅' },
  { key: 'DIALOGUE'    as GameType, label: 'Dialogue',          desc: 'Conversational role-play scenario',      emoji: '💬' },
  { key: 'IMAGE_SPEAK' as GameType, label: 'Image & Speak',     desc: 'See an image, say the English word',     emoji: '🖼️' },
]

const MODULE_EMOJIS: Record<string, string> = {
  'Personal Information': '👤', 'Food & Drink': '🍽️', 'Pets & Animals': '🐾',
  'Friends & Social Life': '👥', 'Hobbies & Entertainment': '🎨', 'Home & Country': '🏡',
  'Leisure & Activities': '🏄', 'Travel & Vacations': '✈️', 'Hotel & Hospitality': '🏨',
  'Restaurant & Food Service': '🍴', 'Handling Complaints': '💬', 'News & Sports': '📰',
  'Tourism': '🗺️', 'Languages': '🌐',
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

// ─── Root screen — manages which view is active ───────────────────────────────

export default function ModulesScreen() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()
  const [view, setView]                     = useState<View>('list')
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)

  const handleLogout = async () => {
    await deleteToken(); clearAuth(); router.replace('/(auth)/login')
  }

  if (view === 'lesson') {
    return (
      <LessonEditorView
        moduleId={currentModuleId!}
        lessonId={currentLessonId}
        onBack={() => { setCurrentLessonId(null); setView('module') }}
        onSaved={() => { setCurrentLessonId(null); setView('module') }}
      />
    )
  }
  if (view === 'module') {
    return (
      <ModuleEditorView
        moduleId={currentModuleId}
        onBack={() => { setCurrentModuleId(null); setView('list') }}
        onEditLesson={(lid) => { setCurrentLessonId(lid); setView('lesson') }}
        onAddLesson={(mid) => { setCurrentModuleId(mid); setCurrentLessonId(null); setView('lesson') }}
        onLogout={handleLogout}
      />
    )
  }
  return (
    <ModuleListView
      onLogout={handleLogout}
      onNew={() => { setCurrentModuleId(null); setView('module') }}
      onEdit={(id) => { setCurrentModuleId(id); setView('module') }}
    />
  )
}

// ─── Module List ──────────────────────────────────────────────────────────────

function ModuleListView({ onLogout, onNew, onEdit }: {
  onLogout: () => void; onNew: () => void; onEdit: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => (await api.get('/api/admin/modules')).data as { modules: ModuleItem[] },
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/modules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-modules'] }),
  })
  const toggle = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => api.patch(`/api/admin/modules/${id}`, { isPublished: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-modules'] }),
  })

  const confirmDel = (m: ModuleItem) =>
    Alert.alert('Delete Module', `Delete "${m.title}" and all its lessons?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(m.id) },
    ])

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>Modules</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={s.toolbar}>
        <View>
          <Text style={s.toolbarTitle}>Dynamic Modules</Text>
          <Text style={s.toolbarSub}>{data?.modules?.length ?? 0} modules</Text>
        </View>
        <TouchableOpacity style={s.navyBtn} onPress={onNew}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={s.navyBtnText}>New Module</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
        : <FlatList
            data={data?.modules ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={<Text style={s.empty}>No modules yet.</Text>}
            renderItem={({ item: m }) => (
              <View style={s.moduleCard}>
                <Text style={s.modEmoji}>{MODULE_EMOJIS[m.title] ?? '📚'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.modTitle} numberOfLines={1}>{m.title}</Text>
                    {!m.isPublished && <View style={s.draftBadge}><Text style={s.draftText}>Draft</Text></View>}
                  </View>
                  <Text style={s.modMeta}>{m.lessonCount} lessons · {m.avgCompletion}% avg</Text>
                </View>
                <Switch
                  value={m.isPublished}
                  onValueChange={(v) => toggle.mutate({ id: m.id, v })}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={m.isPublished ? NAVY : '#9CA3AF'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity style={s.goldBtn} onPress={() => onEdit(m.id)}>
                  <Ionicons name="pencil-outline" size={13} color="#FFF" />
                  <Text style={s.goldBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDel(m)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color={RED} />
                </TouchableOpacity>
              </View>
            )}
          />
      }
    </SafeAreaView>
  )
}

// ─── Module Editor ────────────────────────────────────────────────────────────

function ModuleEditorView({ moduleId, onBack, onEditLesson, onAddLesson, onLogout }: {
  moduleId: string | null
  onBack: () => void
  onEditLesson: (lessonId: string) => void
  onAddLesson: (moduleId: string) => void
  onLogout: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [savedModuleId, setSavedModuleId] = useState<string | null>(moduleId)

  const effectiveId = savedModuleId ?? moduleId

  const { data: modulesData } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => (await api.get('/api/admin/modules')).data as { modules: ModuleItem[] },
  })

  useEffect(() => {
    if (moduleId && modulesData) {
      const m = modulesData.modules.find((m) => m.id === moduleId)
      if (m) { setTitle(m.title); setDescription(m.description) }
    }
  }, [moduleId, modulesData])

  const { data: lessonsData, refetch: refetchLessons } = useQuery({
    queryKey: ['admin-module-lessons', effectiveId],
    queryFn: async () => (await api.get(`/api/admin/modules/${effectiveId}/lessons`)).data as { lessons: LessonItem[] },
    enabled: !!effectiveId,
  })

  const saveModule = useMutation({
    mutationFn: async () => {
      if (effectiveId) {
        await api.patch(`/api/admin/modules/${effectiveId}`, { title: title.trim(), description: description.trim() })
        return effectiveId
      }
      const res = await api.post('/api/admin/modules', { title: title.trim(), description: description.trim() })
      return res.data.module.id as string
    },
    onSuccess: (id) => {
      setSavedModuleId(id)
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
      Alert.alert('Saved', 'Module info saved. Now add lessons below.')
    },
  })

  const delLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/modules/lessons/${id}`),
    onSuccess: () => refetchLessons(),
  })

  const lessons = lessonsData?.lessons ?? []

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>{moduleId ? 'Edit Module' : 'New Module'}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.list, { gap: 12 }]}>
        {/* Module info card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>MODULE INFO</Text>
          <TextInput style={s.input} placeholder="Module title" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />
          <TextInput style={[s.input, { minHeight: 64 }]} placeholder="Short description" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
          <TouchableOpacity
            style={[s.navyBtn, { borderRadius: 10, paddingVertical: 13 }, !title.trim() && s.btnDisabled]}
            disabled={!title.trim() || saveModule.isPending}
            onPress={() => saveModule.mutate()}
          >
            {saveModule.isPending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={[s.navyBtnText, { fontSize: 14 }]}>{effectiveId && moduleId ? 'Save Changes' : 'Create Module'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Lessons card */}
        {effectiveId ? (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.cardLabel}>LESSONS ({lessons.length})</Text>
              <TouchableOpacity
                style={[s.outlineBtn]}
                onPress={() => onAddLesson(effectiveId)}
              >
                <Ionicons name="add" size={15} color={NAVY} />
                <Text style={s.outlineBtnText}>Add Lesson</Text>
              </TouchableOpacity>
            </View>

            {lessons.length === 0 && <Text style={s.empty}>No lessons yet. Add the first one above.</Text>}

            {lessons.map((l, i) => {
              const info = GAME_TYPE_INFO.find((g) => g.key === l.gameType)
              return (
                <View key={l.id} style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 }, i < lessons.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
                  <Text style={{ fontSize: 22 }}>{info?.emoji ?? '📝'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{l.title}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{info?.label} · {l.xpReward} XP</Text>
                  </View>
                  <TouchableOpacity onPress={() => onEditLesson(l.id)} style={{ padding: 6 }}>
                    <Ionicons name="pencil-outline" size={16} color={NAVY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete Lesson', `Delete "${l.title}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => delLesson.mutate(l.id) },
                    ])}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={RED} />
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 8 }}>
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Save module info first, then add lessons.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Lesson Editor ────────────────────────────────────────────────────────────

function LessonEditorView({ moduleId, lessonId, onBack, onSaved }: {
  moduleId: string; lessonId: string | null; onBack: () => void; onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const [step, setStep]         = useState<'info' | 'content'>('info')
  const [title, setTitle]       = useState('')
  const [gameType, setGameType] = useState<GameType>('FLASHCARD')
  const [xpReward, setXpReward] = useState('20')
  const [content, setContent]   = useState<any>({ cards: [] })

  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ['admin-module-lessons', moduleId],
    queryFn: async () => (await api.get(`/api/admin/modules/${moduleId}/lessons`)).data as { lessons: LessonItem[] },
  })

  useEffect(() => {
    if (lessonId && lessonsData) {
      const l = lessonsData.lessons.find((l) => l.id === lessonId)
      if (l) { setTitle(l.title); setGameType(l.gameType); setXpReward(String(l.xpReward)); setContent(l.content) }
    }
  }, [lessonId, lessonsData])

  const save = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim(), gameType, xpReward: Number(xpReward) || 20, content }
      if (lessonId) await api.patch(`/api/admin/modules/lessons/${lessonId}`, payload)
      else await api.post(`/api/admin/modules/${moduleId}/lessons`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-lessons', moduleId] })
      onSaved()
    },
    onError: () => Alert.alert('Error', 'Failed to save lesson.'),
  })

  if (isLoading && lessonId) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View></SafeAreaView>
  }

  const cards = content?.cards ?? []
  const setCards = (cards: any[]) => setContent({ ...content, cards })
  const addCard = (blank: any) => setCards([...cards, { ...blank, id: uid() }])
  const updateCard = (id: string, patch: any) => setCards(cards.map((c: any) => c.id === id ? { ...c, ...patch } : c))
  const removeCard = (id: string) => setCards(cards.filter((c: any) => c.id !== id))

  const canSave = gameType === 'DIALOGUE'
    ? (content?.cards?.[0]?.turns?.length ?? 0) > 0
    : cards.length > 0

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={step === 'content' ? () => setStep('info') : onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ALMA PLATFORM</Text>
          <Text style={s.headerTitle}>{lessonId ? 'Edit Lesson' : 'New Lesson'}</Text>
        </View>
      </View>

      {/* Step dots */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 0 }}>
        <View style={[s.dot, step === 'info' && s.dotActive]} />
        <View style={s.dotLine} />
        <View style={[s.dot, step === 'content' && s.dotActive]} />
      </View>

      {step === 'info' ? (
        <ScrollView contentContainerStyle={s.list}>
          <View style={s.card}>
            <Text style={s.cardLabel}>LESSON INFO</Text>
            <TextInput style={s.input} placeholder="Lesson title" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />
            <TextInput style={s.input} placeholder="XP Reward (default 20)" placeholderTextColor="#9CA3AF" value={xpReward} onChangeText={setXpReward} keyboardType="number-pad" />
          </View>

          <View style={[s.card, { marginTop: 12 }]}>
            <Text style={s.cardLabel}>GAME TYPE</Text>
            {GAME_TYPE_INFO.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[s.gameTypeRow, gameType === g.key && s.gameTypeRowActive]}
                onPress={() => setGameType(g.key)}
              >
                <Text style={{ fontSize: 22, width: 32 }}>{g.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: '#374151' }, gameType === g.key && { color: NAVY }]}>{g.label}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{g.desc}</Text>
                </View>
                {gameType === g.key && <Ionicons name="checkmark-circle" size={20} color={NAVY} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.navyBtn, { borderRadius: 10, paddingVertical: 14, marginTop: 12 }, !title.trim() && s.btnDisabled]}
            disabled={!title.trim()}
            onPress={() => setStep('content')}
          >
            <Text style={[s.navyBtnText, { fontSize: 14 }]}>Next: Add Content →</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[s.list, { paddingBottom: 40 }]}>
          {gameType === 'FLASHCARD'   && <FlashcardForm   cards={cards} addCard={addCard} updateCard={updateCard} removeCard={removeCard} />}
          {gameType === 'WORD_MATCH'  && <WordMatchForm   cards={cards} addCard={addCard} updateCard={updateCard} removeCard={removeCard} />}
          {gameType === 'FILL_BLANK'  && <FillBlankForm   cards={cards} addCard={addCard} updateCard={updateCard} removeCard={removeCard} />}
          {gameType === 'TRUE_FALSE'  && <TrueFalseForm   cards={cards} addCard={addCard} updateCard={updateCard} removeCard={removeCard} />}
          {gameType === 'DIALOGUE'    && <DialogueForm    content={content} onChange={setContent} />}
          {gameType === 'IMAGE_SPEAK' && <ImageSpeakForm  cards={cards} addCard={addCard} updateCard={updateCard} removeCard={removeCard} />}

          <TouchableOpacity
            style={[s.navyBtn, { borderRadius: 10, paddingVertical: 14, marginTop: 16 }, !canSave && s.btnDisabled]}
            disabled={!canSave || save.isPending}
            onPress={() => save.mutate()}
          >
            {save.isPending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={[s.navyBtnText, { fontSize: 14 }]}>Save Lesson</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Flashcard Form ───────────────────────────────────────────────────────────

function FlashcardForm({ cards, addCard, updateCard, removeCard }: any) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>FLASHCARDS ({cards.length})</Text>
      {cards.map((c: FlashCard, i: number) => (
        <View key={c.id} style={[s.cardBlock, i < cards.length - 1 && s.blockBorder]}>
          <CardHeader num={i + 1} onRemove={() => removeCard(c.id)} />
          <TextInput style={s.input} placeholder="Word (e.g. Name)" placeholderTextColor="#9CA3AF" value={c.word} onChangeText={(v) => updateCard(c.id, { word: v })} />
          <TextInput style={s.input} placeholder="Translation / description" placeholderTextColor="#9CA3AF" value={c.translation} onChangeText={(v) => updateCard(c.id, { translation: v })} />
          <ImageEmojiPicker value={c.imageUrl ?? ''} onChange={(v) => updateCard(c.id, { imageUrl: v })} />
          <TextInput style={s.input} placeholder="Target word student must say" placeholderTextColor="#9CA3AF" value={c.targetWord} onChangeText={(v) => updateCard(c.id, { targetWord: v })} />
        </View>
      ))}
      <AddCardBtn label="Add Flashcard" onPress={() => addCard({ word: '', translation: '', imageUrl: '', targetWord: '' })} />
    </View>
  )
}

// ─── Word Match Form ──────────────────────────────────────────────────────────

function WordMatchForm({ cards, addCard, updateCard, removeCard }: any) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>WORD MATCH CARDS ({cards.length})</Text>
      {cards.map((c: WordMatchCard, i: number) => (
        <View key={c.id} style={[s.cardBlock, i < cards.length - 1 && s.blockBorder]}>
          <CardHeader num={i + 1} onRemove={() => removeCard(c.id)} />
          <TextInput style={s.input} placeholder="Emoji (e.g. 🎂)" placeholderTextColor="#9CA3AF" value={c.emoji} onChangeText={(v) => updateCard(c.id, { emoji: v })} />
          <TextInput style={s.input} placeholder="Correct word (e.g. Birthday)" placeholderTextColor="#9CA3AF" value={c.correctWord} onChangeText={(v) => updateCard(c.id, { correctWord: v })} />
          {[0, 1, 2].map((di) => (
            <TextInput key={di} style={s.input} placeholder={`Wrong option ${di + 1}`} placeholderTextColor="#9CA3AF"
              value={c.distractors?.[di] ?? ''}
              onChangeText={(v) => { const d = [...(c.distractors ?? ['', '', ''])]; d[di] = v; updateCard(c.id, { distractors: d }) }}
            />
          ))}
        </View>
      ))}
      <AddCardBtn label="Add Word Match Card" onPress={() => addCard({ emoji: '', correctWord: '', distractors: ['', '', ''] })} />
    </View>
  )
}

// ─── Fill in the Blank Form ───────────────────────────────────────────────────

function FillBlankForm({ cards, addCard, updateCard, removeCard }: any) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>FILL IN THE BLANK ({cards.length})</Text>
      {cards.map((c: FillBlankCard, i: number) => (
        <View key={c.id} style={[s.cardBlock, i < cards.length - 1 && s.blockBorder]}>
          <CardHeader num={i + 1} onRemove={() => removeCard(c.id)} />
          <TextInput style={s.input} placeholder="Sentence with _____ as the blank (e.g. My _____ is Maria.)" placeholderTextColor="#9CA3AF" value={c.sentenceTemplate} onChangeText={(v) => updateCard(c.id, { sentenceTemplate: v })} />
          <TextInput style={s.input} placeholder="Correct answer (e.g. name)" placeholderTextColor="#9CA3AF" value={c.correctAnswer} onChangeText={(v) => updateCard(c.id, { correctAnswer: v })} />
          <TextInput style={s.input} placeholder="Hint (e.g. Personal identity word)" placeholderTextColor="#9CA3AF" value={c.hint} onChangeText={(v) => updateCard(c.id, { hint: v })} />
          {[0, 1, 2].map((di) => (
            <TextInput key={di} style={s.input} placeholder={`Wrong option ${di + 1}`} placeholderTextColor="#9CA3AF"
              value={c.distractors?.[di] ?? ''}
              onChangeText={(v) => { const d = [...(c.distractors ?? ['', '', ''])]; d[di] = v; updateCard(c.id, { distractors: d }) }}
            />
          ))}
        </View>
      ))}
      <AddCardBtn label="Add Fill-in-Blank Card" onPress={() => addCard({ sentenceTemplate: '', correctAnswer: '', hint: '', distractors: ['', '', ''] })} />
    </View>
  )
}

// ─── True / False Form ────────────────────────────────────────────────────────

function TrueFalseForm({ cards, addCard, updateCard, removeCard }: any) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>TRUE / FALSE CARDS ({cards.length})</Text>
      {cards.map((c: TrueFalseCard, i: number) => (
        <View key={c.id} style={[s.cardBlock, i < cards.length - 1 && s.blockBorder]}>
          <CardHeader num={i + 1} onRemove={() => removeCard(c.id)} />
          <TextInput style={s.input} placeholder='Statement (e.g. "Mother tongue" means the first language you learned.)' placeholderTextColor="#9CA3AF" value={c.statement} onChangeText={(v) => updateCard(c.id, { statement: v })} multiline />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Answer:</Text>
            <TouchableOpacity
              style={[s.tfBtn, c.isTrue && s.tfBtnTrue]}
              onPress={() => updateCard(c.id, { isTrue: true })}
            >
              <Text style={[s.tfBtnText, c.isTrue && { color: GREEN }]}>✓ True</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tfBtn, !c.isTrue && s.tfBtnFalse]}
              onPress={() => updateCard(c.id, { isTrue: false })}
            >
              <Text style={[s.tfBtnText, !c.isTrue && { color: RED }]}>✗ False</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={s.input} placeholder="Explanation shown after the student answers" placeholderTextColor="#9CA3AF" value={c.explanation} onChangeText={(v) => updateCard(c.id, { explanation: v })} multiline />
        </View>
      ))}
      <AddCardBtn label="Add True/False Card" onPress={() => addCard({ statement: '', isTrue: true, explanation: '' })} />
    </View>
  )
}

// ─── Dialogue Form ────────────────────────────────────────────────────────────

function DialogueForm({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const card      = content?.cards?.[0]
  const scenario  = card?.scenario ?? ''
  const turns: DialogueTurn[] = card?.turns ?? []

  const update = (newScenario: string, newTurns: DialogueTurn[]) =>
    onChange({ cards: [{ id: card?.id ?? uid(), scenario: newScenario, turns: newTurns }] })

  const addTurn = (speaker: 'GUEST' | 'USER') =>
    update(scenario, [...turns, { speaker, text: '', expectedResponse: '' }])

  const updateTurn = (i: number, patch: Partial<DialogueTurn>) =>
    update(scenario, turns.map((t, idx) => idx === i ? { ...t, ...patch } : t))

  const removeTurn = (i: number) =>
    update(scenario, turns.filter((_, idx) => idx !== i))

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>DIALOGUE SCENARIO</Text>
      <TextInput
        style={[s.input, { minHeight: 64 }]}
        placeholder="Describe the scenario (e.g. Introduce yourself to a new friend at a hotel.)"
        placeholderTextColor="#9CA3AF"
        value={scenario}
        onChangeText={(v) => update(v, turns)}
        multiline
        textAlignVertical="top"
      />

      <Text style={[s.cardLabel, { marginTop: 8 }]}>CONVERSATION TURNS ({turns.length})</Text>
      <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
        GUEST = what the other person says · USER = what the student must speak
      </Text>

      {turns.map((t, i) => (
        <View key={i} style={[s.turnBlock, t.speaker === 'GUEST' ? s.turnGuest : s.turnUser]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={[s.speakerBadge, t.speaker === 'GUEST' ? s.speakerGuestBg : s.speakerUserBg]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>
                {t.speaker === 'GUEST' ? '🗣️  GUEST says' : '🎤  USER speaks'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeTurn(i)}>
              <Ionicons name="close-circle-outline" size={18} color={RED} />
            </TouchableOpacity>
          </View>
          {t.speaker === 'GUEST' ? (
            <TextInput
              style={s.input}
              placeholder="What the guest says (e.g. Hi! What is your name?)"
              placeholderTextColor="#9CA3AF"
              value={t.text}
              onChangeText={(v) => updateTurn(i, { text: v })}
              multiline
            />
          ) : (
            <TextInput
              style={s.input}
              placeholder="Expected response the student should speak (e.g. My name is Alex.)"
              placeholderTextColor="#9CA3AF"
              value={t.expectedResponse}
              onChangeText={(v) => updateTurn(i, { expectedResponse: v })}
              multiline
            />
          )}
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity style={[s.outlineBtn, { flex: 1, justifyContent: 'center' }]} onPress={() => addTurn('GUEST')}>
          <Text style={s.outlineBtnText}>+ Guest Turn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.navyBtn, { flex: 1, borderRadius: 10, justifyContent: 'center' }]} onPress={() => addTurn('USER')}>
          <Text style={[s.navyBtnText, { fontSize: 13 }]}>+ User Turn</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Image & Speak Form ───────────────────────────────────────────────────────

function ImageSpeakForm({ cards, addCard, updateCard, removeCard }: any) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>IMAGE & SPEAK CARDS ({cards.length})</Text>
      {cards.map((c: ImageSpeakCard, i: number) => (
        <View key={c.id} style={[s.cardBlock, i < cards.length - 1 && s.blockBorder]}>
          <CardHeader num={i + 1} onRemove={() => removeCard(c.id)} />
          <ImageEmojiPicker value={c.imageUrl ?? ''} onChange={(v) => updateCard(c.id, { imageUrl: v })} label="Image" />
          <TextInput style={s.input} placeholder="Target word student must say (e.g. cat)" placeholderTextColor="#9CA3AF" value={c.targetWord} onChangeText={(v) => updateCard(c.id, { targetWord: v })} />
          <TextInput style={s.input} placeholder="Hint (optional, e.g. A common household pet)" placeholderTextColor="#9CA3AF" value={c.hint} onChangeText={(v) => updateCard(c.id, { hint: v })} />
        </View>
      ))}
      <AddCardBtn label="Add Image & Speak Card" onPress={() => addCard({ imageUrl: '', targetWord: '', hint: '' })} />
    </View>
  )
}

// ─── Image / Emoji hybrid picker ─────────────────────────────────────────────

const QUICK_EMOJIS = [
  '🍎','🍕','🍔','🍜','🥗','🍰','🥩','🥦','🍺','☕',
  '🐾','🐕','🐈','🦁','🐟','🦋','🌿','🌸',
  '👤','👥','🤝','👨‍👩‍👦','💼','🏠','✈️','🏨',
  '📚','🎨','🎯','💬','🏋️','🎤','🌍','🌐',
  '🏄','🎸','🖼️','🎭','⚽','🏀','🏊','🚴',
]

function ImageEmojiPicker({
  value, onChange, label = 'Image / Emoji',
}: { value: string; onChange: (v: string) => void; label?: string }) {
  const [mode, setMode] = useState<'image' | 'emoji'>(() => {
    if (!value || value.startsWith('http')) return 'image'
    if (value.startsWith('local:')) return 'image'
    return 'emoji'
  })
  const [uploading, setUploading] = useState(false)
  const [showEmojiGrid, setShowEmojiGrid] = useState(false)

  const isRemote = value.startsWith('http')
  const isEmoji = !value.startsWith('http') && !value.startsWith('local:') && value.length > 0

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow access to your photo library.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.85,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', { uri: asset.uri, name: 'lesson.jpg', type: 'image/jpeg' } as any)
      const { data } = await api.post('/api/admin/modules/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Mode toggle */}
      <View style={s2.modeRow}>
        <TouchableOpacity
          style={[s2.modeBtn, mode === 'image' && s2.modeBtnActive]}
          onPress={() => { setMode('image'); if (isEmoji) onChange('') }}
        >
          <Text style={[s2.modeBtnText, mode === 'image' && s2.modeBtnTextActive]}>📷 Image</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s2.modeBtn, mode === 'emoji' && s2.modeBtnActive]}
          onPress={() => { setMode('emoji'); if (isRemote) onChange('') }}
        >
          <Text style={[s2.modeBtnText, mode === 'emoji' && s2.modeBtnTextActive]}>😀 Emoji</Text>
        </TouchableOpacity>
      </View>

      {mode === 'image' ? (
        <View>
          {/* Preview */}
          {isRemote && (
            <Image source={{ uri: value }} style={s2.previewImage} resizeMode="cover" />
          )}
          {/* Upload button */}
          <TouchableOpacity style={s2.uploadBtn} onPress={pickImage} disabled={uploading}>
            {uploading
              ? <ActivityIndicator size="small" color={NAVY} />
              : <>
                  <Ionicons name="cloud-upload-outline" size={18} color={NAVY} />
                  <Text style={s2.uploadBtnText}>{isRemote ? 'Replace Image' : 'Upload Image'}</Text>
                </>
            }
          </TouchableOpacity>
          {/* Or paste URL */}
          <TextInput
            style={s.input}
            placeholder="Or paste image URL (https://...)"
            placeholderTextColor="#9CA3AF"
            value={isRemote ? value : ''}
            onChangeText={onChange}
            autoCapitalize="none"
          />
        </View>
      ) : (
        <View>
          <TextInput
            style={[s.input, { fontSize: 28, textAlign: 'center' }]}
            placeholder="Type or paste emoji"
            placeholderTextColor="#9CA3AF"
            value={isEmoji ? value : ''}
            onChangeText={onChange}
          />
          {/* Quick emoji grid */}
          <TouchableOpacity onPress={() => setShowEmojiGrid(!showEmojiGrid)} style={s2.gridToggle}>
            <Text style={s2.gridToggleText}>{showEmojiGrid ? '▲ Hide' : '▼ Quick pick'}</Text>
          </TouchableOpacity>
          {showEmojiGrid && (
            <View style={s2.emojiGrid}>
              {QUICK_EMOJIS.map((e) => (
                <TouchableOpacity key={e} onPress={() => { onChange(e); setShowEmojiGrid(false) }} style={s2.emojiCell}>
                  <Text style={s2.emojiCellText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Shared mini-components ───────────────────────────────────────────────────

function CardHeader({ num, onRemove }: { num: number; onRemove: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>Card {num}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="trash-outline" size={16} color={RED} />
      </TouchableOpacity>
    </View>
  )
}

function AddCardBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 14, justifyContent: 'center' }} onPress={onPress}>
      <Ionicons name="add-circle-outline" size={20} color={NAVY} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY }}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: BG },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  headerTitle:{ color: '#FFF', fontSize: 22, fontWeight: '700' },
  logoutBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },
  toolbar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  toolbarTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  toolbarSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  list:       { padding: 16, paddingBottom: 40 },
  empty:      { textAlign: 'center', color: '#9CA3AF', paddingVertical: 16 },

  navyBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: NAVY, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  navyBtnText:{ fontSize: 13, fontWeight: '600', color: '#FFF' },
  goldBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  goldBtnText:{ fontSize: 12, fontWeight: '700', color: '#FFF' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: NAVY, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: NAVY },
  btnDisabled:{ opacity: 0.4 },

  moduleCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  modEmoji:   { fontSize: 24 },
  modTitle:   { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  modMeta:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  draftBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  draftText:  { fontSize: 10, color: '#6B7280', fontWeight: '600' },

  card:       { backgroundColor: CARD, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardLabel:  { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  input:      { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1F2937', marginBottom: 10, backgroundColor: '#FAFAFA' },

  cardBlock:  { paddingVertical: 12 },
  blockBorder:{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  dot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  dotActive:  { backgroundColor: NAVY, width: 14, height: 14, borderRadius: 7 },
  dotLine:    { width: 56, height: 2, backgroundColor: '#E5E7EB' },

  gameTypeRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4 },
  gameTypeRowActive:{ backgroundColor: '#EFF6FF' },

  tfBtn:      { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  tfBtnTrue:  { backgroundColor: '#D1FAE5', borderColor: GREEN },
  tfBtnFalse: { backgroundColor: '#FEE2E2', borderColor: RED },
  tfBtnText:  { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  turnBlock:      { borderRadius: 10, padding: 12, marginBottom: 10 },
  turnGuest:      { backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#DBEAFE' },
  turnUser:       { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#D1FAE5' },
  speakerBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  speakerGuestBg: { backgroundColor: '#DBEAFE' },
  speakerUserBg:  { backgroundColor: '#D1FAE5' },
})

const s2 = StyleSheet.create({
  modeRow:          { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeBtn:          { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  modeBtnActive:    { borderColor: NAVY, backgroundColor: '#EFF6FF' },
  modeBtnText:      { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  modeBtnTextActive:{ color: NAVY, fontWeight: '700' },
  previewImage:     { width: '100%', height: 140, borderRadius: 10, marginBottom: 8 },
  uploadBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: NAVY, borderRadius: 10, paddingVertical: 10, marginBottom: 8 },
  uploadBtnText:    { fontSize: 13, fontWeight: '600', color: NAVY },
  gridToggle:       { alignItems: 'center', paddingVertical: 6, marginBottom: 6 },
  gridToggleText:   { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  emojiGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  emojiCell:        { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  emojiCellText:    { fontSize: 22 },
})
