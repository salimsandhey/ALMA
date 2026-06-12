import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useVoiceStore, VoiceGender } from '../stores/voiceStore'
import { playTTS, PlayState, TTSSource } from '../lib/tts'
import { NAVY, GOLD, GREY } from '../constants/colors'

const PRESETS = [
  'Welcome to our hotel. How may I help you?',
  'Your room is on the third floor.',
  'Breakfast is served from 7 to 10 AM.',
  'I will arrange that for you right away.',
  'Thank you for staying with us.',
  'Have a wonderful day!',
]

export default function TTSTestScreen() {
  const router = useRouter()
  const { voiceGender, setVoiceGender } = useVoiceStore()
  const [customText, setCustomText] = useState('')
  const [activeText, setActiveText] = useState(PRESETS[0])
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [lastSource, setLastSource] = useState<TTSSource | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const selectPreset = (text: string) => {
    setActiveText(text)
    setCustomText('')
  }

  const handleCustomTextChange = (val: string) => {
    setCustomText(val)
    if (val.trim()) setActiveText(val.trim())
  }

  const handlePlay = () => {
    if (playState !== 'idle') {
      cancelRef.current?.()
      cancelRef.current = null
      setPlayState('idle')
      return
    }
    playTTS(activeText, voiceGender, setPlayState, setLastSource).then((cancel) => {
      cancelRef.current = cancel
    })
  }

  const sourceColor = lastSource === 'kokoro' ? '#059669' : '#D97706'
  const sourceLabel = lastSource === 'kokoro' ? '✓ Kokoro neural voice' : '⚠ Device fallback (expo-speech)'
  const sourceBg = lastSource === 'kokoro' ? '#D1FAE5' : '#FEF3C7'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={NAVY} />
            </TouchableOpacity>
            <Text style={styles.title}>Voice Test</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Source badge — shows after first play */}
          {lastSource !== null && (
            <View style={[styles.sourceBadge, { backgroundColor: sourceBg }]}>
              <Text style={[styles.sourceBadgeText, { color: sourceColor }]}>{sourceLabel}</Text>
            </View>
          )}

          {/* Voice selector */}
          <Text style={styles.sectionLabel}>Voice</Text>
          <View style={styles.voiceRow}>
            {(['female', 'male'] as VoiceGender[]).map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[styles.voicePill, voiceGender === gender && styles.voicePillActive]}
                activeOpacity={0.8}
                onPress={() => setVoiceGender(gender)}
              >
                <Text style={styles.voicePillIcon}>{gender === 'female' ? '👩' : '👨'}</Text>
                <Text style={[styles.voicePillText, voiceGender === gender && styles.voicePillTextActive]}>
                  {gender === 'female' ? 'Female' : 'Male'}
                </Text>
                {voiceGender === gender && (
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Active text + play */}
          <Text style={styles.sectionLabel}>Playing</Text>
          <View style={styles.playCard}>
            <Text style={styles.playCardText} numberOfLines={4}>{activeText}</Text>
            <View style={styles.playCardFooter}>
              <Text style={styles.playCardVoiceTag}>
                {voiceGender === 'female' ? 'af_heart · Female' : 'am_michael · Male'}
              </Text>
              <TouchableOpacity
                onPress={handlePlay}
                activeOpacity={0.7}
                style={[styles.playBtn, playState !== 'idle' && styles.playBtnActive]}
                disabled={playState === 'loading'}
              >
                {playState === 'loading' ? (
                  <Text style={styles.playBtnText}>...</Text>
                ) : playState === 'playing' ? (
                  <Ionicons name="stop" size={18} color={NAVY} />
                ) : (
                  <Ionicons name="play" size={18} color={NAVY} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom input */}
          <Text style={styles.sectionLabel}>Type your own text</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={customText}
              onChangeText={handleCustomTextChange}
              placeholder="Type anything to test the voice..."
              placeholderTextColor="#9CA3AF"
              multiline
              returnKeyType="done"
            />
          </View>

          {/* Preset sentences */}
          <Text style={styles.sectionLabel}>Preset sentences</Text>
          {PRESETS.map((text) => {
            const isActive = activeText === text && !customText
            return (
              <TouchableOpacity
                key={text}
                style={[styles.presetRow, isActive && styles.presetRowActive]}
                activeOpacity={0.75}
                onPress={() => selectPreset(text)}
              >
                <Text
                  style={[styles.presetText, isActive && styles.presetTextActive]}
                  numberOfLines={2}
                >
                  {text}
                </Text>
              </TouchableOpacity>
            )
          })}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F3F7' },
  content: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '800', color: NAVY },

  sourceBadge: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4,
  },
  sourceBadgeText: { fontSize: 13, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: GREY,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: 20,
  },

  voiceRow: { flexDirection: 'row', gap: 10 },
  voicePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', gap: 6,
  },
  voicePillActive: { backgroundColor: NAVY, borderColor: NAVY },
  voicePillIcon: { fontSize: 18 },
  voicePillText: { fontSize: 14, fontWeight: '700', color: NAVY },
  voicePillTextActive: { color: '#fff' },

  playCard: { backgroundColor: GOLD, borderRadius: 18, padding: 18 },
  playCardText: { fontSize: 16, fontWeight: '700', color: NAVY, lineHeight: 24 },
  playCardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 12,
  },
  playCardVoiceTag: { fontSize: 11, color: 'rgba(9,51,115,0.6)', fontWeight: '600' },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  playBtnActive: { backgroundColor: '#FDE68A' },
  playBtnText: { fontSize: 16, color: NAVY, fontWeight: '700' },

  inputRow: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { fontSize: 15, color: NAVY, minHeight: 60, textAlignVertical: 'top' },

  presetRow: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  presetRowActive: { backgroundColor: NAVY },
  presetText: { fontSize: 14, color: NAVY, fontWeight: '500', lineHeight: 20 },
  presetTextActive: { color: '#fff' },
})
