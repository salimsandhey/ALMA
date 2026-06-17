import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  View, Text, TouchableOpacity, Animated, StyleSheet,
  TextInput, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SpeechState, stateLabel } from '../../lib/speech'
import { GOLD, TEAL } from '../../constants/colors'

const _speechMod = (() => {
  try { return require('expo-speech-recognition') } catch { return null }
})()

const SpeechModule = _speechMod?.ExpoSpeechRecognitionModule ?? null
const useSpeechHook: (event: string, cb: (e: any) => void) => void =
  _speechMod?.useSpeechRecognitionEvent ?? ((_e: string, _cb: any) => {})

const IS_NATIVE = SpeechModule !== null

export interface MicButtonRef {
  startListening: () => Promise<void>
  stopListening: () => void
}

interface MicButtonProps {
  onResult: (texts: string[]) => void
  onInterim?: (text: string) => void
  onStateChange?: (state: SpeechState) => void
  disabled?: boolean
  label?: string
  tone?: 'teal' | 'yellow'
}

const MicButton = forwardRef<MicButtonRef, MicButtonProps>(function MicButton({
  onResult,
  onInterim,
  onStateChange,
  disabled,
  label = 'Tap mic to pronounce',
  tone = 'teal',
}, ref) {
  const [listening, setListening] = useState(false)
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)

  useSpeechHook('result', (e: any) => {
    if (!e.isFinal) {
      const interim: string = e.results?.[0]?.transcript ?? ''
      if (interim) onInterim?.(interim)
      return
    }
    const transcripts: string[] = (e.results ?? [])
      .map((r: any) => r?.transcript ?? '')
      .filter(Boolean)
    if (transcripts.length === 0) return
    onStateChange?.('processing')
    onResult(transcripts)
    onInterim?.('')
  })

  useSpeechHook('end', () => {
    setListening(false)
    onInterim?.('')
  })

  useSpeechHook('error', (e: any) => {
    setListening(false)
    onInterim?.('')
    const code = String(e?.error || e?.code || '').toLowerCase()
    if (code.includes('permission')) onStateChange?.('no_permission')
    else if (code.includes('no-speech')) onStateChange?.('no_speech')
    else onStateChange?.('failed')
  })

  useEffect(() => {
    if (listening) {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
        ])
      )
      pulseLoop.current.start()
    } else {
      pulseLoop.current?.stop()
      pulseAnim.setValue(1)
      pulseOpacity.setValue(1)
    }
  }, [listening])

  const startListening = async () => {
    if (!IS_NATIVE) {
      onStateChange?.('failed')
      setFallbackText('')
      setFallbackVisible(true)
      return
    }
    try {
      const perm = await SpeechModule.requestPermissionsAsync()
      if (!perm.granted) {
        onStateChange?.('no_permission')
        setFallbackText('')
        setFallbackVisible(true)
        return
      }
    } catch {
      // continue — permission already granted
    }

    setListening(true)
    onStateChange?.('listening')
    try {
      await SpeechModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 3,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      })
    } catch {
      setListening(false)
      onStateChange?.('failed')
      setFallbackText('')
      setFallbackVisible(true)
    }
  }

  const stopListening = () => {
    if (IS_NATIVE && listening) {
      SpeechModule.stop()
    }
    setListening(false)
    onStateChange?.('processing')
  }

  useImperativeHandle(ref, () => ({ startListening, stopListening }))

  const handlePress = async () => {
    if (disabled) return
    if (listening) {
      stopListening()
      return
    }
    await startListening()
  }

  const handleFallbackSubmit = () => {
    const trimmed = fallbackText.trim()
    if (trimmed) {
      onStateChange?.('processing')
      onResult([trimmed])
    }
    setFallbackVisible(false)
    setFallbackText('')
  }

  return (
    <View style={styles.wrapper}>
      {listening && (
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: listening ? '#EF4444' : tone === 'yellow' ? GOLD : TEAL },
          disabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
      >
        <Ionicons name={listening ? 'stop' : 'mic-outline'} size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.label}>
        {listening ? stateLabel('listening') : label}
      </Text>

      {!IS_NATIVE && (
        <Text style={styles.devNote}>Tap mic to type (dev mode)</Text>
      )}

      <Modal visible={fallbackVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Type your answer</Text>
            <Text style={styles.modalSub}>
              Microphone needs a dev build. Type to test the flow.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={fallbackText}
              onChangeText={setFallbackText}
              placeholder="Type what you would say..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleFallbackSubmit}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFallbackVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleFallbackSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
})

export default MicButton

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EF444440',
  },
  button: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  label: { marginTop: 8, fontSize: 12, color: '#6B7280', textAlign: 'center' },
  devNote: { marginTop: 4, fontSize: 10, color: '#F59E0B' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', paddingHorizontal: 28,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#093373', marginBottom: 6 },
  modalSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 16, lineHeight: 17 },
  modalInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#111', backgroundColor: '#F9FAFB',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#F3F4F6',
  },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  submitBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', backgroundColor: TEAL,
  },
  submitText: { color: '#fff', fontWeight: '700' },
})
