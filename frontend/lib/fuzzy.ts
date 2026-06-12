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
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Returns a similarity score [0, 1] between two strings.
 * Uses word-level levenshtein matching to avoid false positives from
 * substring coincidences and character-count overlap.
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
    // Single-word target: word-level match is the authoritative signal
    return avgWordMatch
  }

  // Multi-word: blend word coverage with string similarity
  return Math.max(avgWordMatch * 0.7 + stringSim * 0.3, stringSim)
}
