import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type Band = 'high' | 'medium' | 'low'

function getBand(score: number): Band {
  // score is 0–1 from local fuzzy match
  if (score >= 0.85) return 'high'
  if (score >= 0.60) return 'medium'
  return 'low'
}

const CONFIG: Record<Band, { label: string; bg: string; text: string }> = {
  high:   { label: 'High confidence',   bg: '#D1FAE5', text: '#065F46' },
  medium: { label: 'Medium confidence', bg: '#FEF3C7', text: '#92400E' },
  low:    { label: 'Low confidence',    bg: '#FEE2E2', text: '#991B1B' },
}

interface ConfidenceBadgeProps {
  score: number // 0–1
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const band = getBand(score)
  const { label, bg, text } = CONFIG[band]

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: '600' },
})
