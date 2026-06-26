import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  interimText: string
  lastSpoken: string
}

export default function SpeechPreview({ interimText, lastSpoken }: Props) {
  if (!interimText && !lastSpoken) return null

  if (interimText) {
    return (
      <View style={styles.liveBox}>
        <Ionicons name="mic" size={13} color="#EF4444" style={{ marginRight: 6 }} />
        <Text style={styles.liveText} numberOfLines={2}>{interimText}</Text>
      </View>
    )
  }

  return (
    <View style={styles.spokenBox}>
      <Text style={styles.spokenLabel}>You said</Text>
      <Text style={styles.spokenText}>"{lastSpoken}"</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  liveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  liveText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  spokenBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  spokenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  spokenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    textAlign: 'center',
  },
})
