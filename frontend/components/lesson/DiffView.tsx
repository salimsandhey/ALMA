import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type TokenType = 'correct' | 'wrong' | 'missing' | 'extra'
type Token = { word: string; type: TokenType }

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim()
}

function computeDiff(target: string, spoken: string): Token[] {
  const tTokens = normalize(target).split(' ').filter(Boolean)
  const sTokens = normalize(spoken).split(' ').filter(Boolean)
  const out: Token[] = []

  for (let i = 0; i < tTokens.length; i++) {
    const expected = tTokens[i]
    const actual = sTokens[i]
    if (!actual) {
      out.push({ word: expected, type: 'missing' })
    } else if (expected === actual) {
      out.push({ word: actual, type: 'correct' })
    } else {
      out.push({ word: actual, type: 'wrong' })
    }
  }
  for (let i = tTokens.length; i < sTokens.length; i++) {
    out.push({ word: sTokens[i], type: 'extra' })
  }
  return out
}

interface DiffViewProps {
  target: string
  spoken: string
}

export default function DiffView({ target, spoken }: DiffViewProps) {
  const tokens = computeDiff(target, spoken)
  const allCorrect = tokens.every((t) => t.type === 'correct')

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {tokens.map((t, i) => (
          <View key={i} style={[styles.token, tokenBg[t.type]]}>
            <Text style={[styles.tokenText, tokenColor[t.type]]}>
              {t.type === 'missing' ? `(${t.word})` : t.word}
            </Text>
          </View>
        ))}
      </View>
      {!allCorrect && (
        <Text style={styles.expected}>
          Expected: <Text style={styles.expectedWord}>{target}</Text>
        </Text>
      )}
    </View>
  )
}

const tokenBg: Record<TokenType, object> = {
  correct: { backgroundColor: '#D1FAE5' },
  wrong:   { backgroundColor: '#FEE2E2' },
  missing: { backgroundColor: '#F3F4F6' },
  extra:   { backgroundColor: '#FEF3C7' },
}

const tokenColor: Record<TokenType, object> = {
  correct: { color: '#065F46' },
  wrong:   { color: '#991B1B' },
  missing: { color: '#9CA3AF' },
  extra:   { color: '#92400E' },
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  token: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tokenText: { fontSize: 14, fontWeight: '600' },
  expected: { marginTop: 6, fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  expectedWord: { color: '#6B7280', fontWeight: '600' },
})
