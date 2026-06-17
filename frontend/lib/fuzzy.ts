// Contraction → expanded form. Applied before apostrophe stripping so "I'm" → "i am", not "im".
const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'],
  [/\bi've\b/g, 'i have'],
  [/\bi'll\b/g, 'i will'],
  [/\bi'd\b/g, 'i would'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'],
  [/\bhere's\b/g, 'here is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwhere's\b/g, 'where is'],
  [/\bhow's\b/g, 'how is'],
  [/\bthey're\b/g, 'they are'],
  [/\bwe're\b/g, 'we are'],
  [/\byou're\b/g, 'you are'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bcouldn't\b/g, 'could not'],
  [/\bwouldn't\b/g, 'would not'],
  [/\bshouldn't\b/g, 'should not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'],
  [/\bweren't\b/g, 'were not'],
  [/\bhaven't\b/g, 'have not'],
  [/\bhasn't\b/g, 'has not'],
  [/\bhadn't\b/g, 'had not'],
  [/\bthey've\b/g, 'they have'],
  [/\bwe've\b/g, 'we have'],
  [/\byou've\b/g, 'you have'],
  [/\bhe'd\b/g, 'he would'],
  [/\bshe'd\b/g, 'she would'],
  [/\bthey'd\b/g, 'they would'],
  [/\bwe'd\b/g, 'we would'],
  [/\byou'd\b/g, 'you would'],
  [/\blet's\b/g, 'let us'],
]

const FILLER_RE = /\b(um+|uh+|er|ah|hmm+|like|you know|well|so|okay|ok|right)\b/g

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0)
    row[0] = i
    return row
  })
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function wordSim(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

function normalizeStr(s: string): string {
  let n = s.toLowerCase()
  // Expand contractions before stripping apostrophes
  for (const [pattern, replacement] of CONTRACTIONS) n = n.replace(pattern, replacement)
  // Strip non-alphanumeric (removes remaining apostrophes and punctuation)
  n = n.replace(/[^a-z0-9\s]/g, '')
  // Remove filler words
  n = n.replace(FILLER_RE, '')
  return n.replace(/\s+/g, ' ').trim()
}

/**
 * Returns a similarity score [0, 1] between two strings.
 * Normalises contractions and filler words before comparison.
 */
export function similarity(a: string, b: string): number {
  const aN = normalizeStr(a)
  const bN = normalizeStr(b)
  if (aN === bN) return 1

  const aWords = aN.split(' ').filter(Boolean)
  const bWords = bN.split(' ').filter(Boolean)

  if (aWords.length === 0 || bWords.length === 0) return 0

  // For each target word, find the best matching spoken word
  const wordMatchScores = aWords.map((tw) =>
    Math.max(...bWords.map((sw) => wordSim(sw, tw)))
  )
  const avgWordMatch =
    wordMatchScores.reduce((sum, v) => sum + v, 0) / wordMatchScores.length

  // Overall string-level similarity penalises word order errors
  const maxLen = Math.max(aN.length, bN.length)
  const stringSim = maxLen === 0 ? 1 : 1 - levenshteinDistance(aN, bN) / maxLen

  if (aWords.length === 1) {
    return avgWordMatch
  }

  return Math.max(avgWordMatch * 0.7 + stringSim * 0.3, stringSim)
}

/**
 * Given multiple STT alternative transcripts, returns the one that scores
 * highest against `target`, along with its score.
 */
export function pickBest(
  transcripts: string[],
  target: string
): { text: string; score: number } {
  let best = transcripts[0]
  let bestScore = similarity(transcripts[0], target)
  for (let i = 1; i < transcripts.length; i++) {
    const s = similarity(transcripts[i], target)
    if (s > bestScore) {
      bestScore = s
      best = transcripts[i]
    }
  }
  return { text: best, score: bestScore }
}
