import anthropic from '../lib/anthropic'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 86400
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, windowSeconds)
  const remaining = Math.max(0, limit - current)
  return { allowed: current <= limit, remaining }
}

export async function logAIUsage(userId: string, feature: string): Promise<void> {
  await prisma.aIUsageLog.create({ data: { userId, feature } })
}

const COACH_SYSTEM_PROMPT = `You are ALMA, a friendly and encouraging English language tutor for tourism and hospitality workers. Your students are adults who use English on the job - at hotels, restaurants, and tourist sites.

Your role:
- Help students practice English conversation
- Answer questions about English grammar, vocabulary, and pronunciation
- Focus on hospitality-specific language when possible
- Be warm, patient, and positive
- Keep responses concise (2-4 sentences for conversational replies)
- Use simple, clear English appropriate for intermediate learners
- Never speak in the student's native language
- Never discuss topics unrelated to English learning

If the student makes a grammar or spelling error, gently note it AFTER responding to their message. Format the correction as: [Correction: ...]`

const GRAMMAR_CHECK_SYSTEM_PROMPT = `You are a grammar checker for English learners. Analyze the given text and identify grammar errors.

Respond ONLY with valid JSON. No other text.

JSON format:
{
  "hasError": boolean,
  "correctedText": "string (corrected version, or same as input if no error)",
  "explanation": "string (brief explanation in simple English, or empty string if no error)",
  "errorType": "string (e.g. VERB_TENSE, SUBJECT_VERB_AGREEMENT, WORD_ORDER, MISSING_ARTICLE, SPELLING, PREPOSITION, null if no error)"
}`

const WARMUP_SYSTEM_PROMPT = `You are ALMA, a warm and friendly English tutor. You are starting a short daily warm-up conversation with a student who works in tourism or hospitality.

Your goal: Have a natural, encouraging 5-turn conversation. Ask about their day, their work, or a simple topic. Keep it light and positive.

Rules:
- Keep every response to 1-2 sentences maximum
- Ask a single follow-up question each turn
- After exactly 5 user turns, end the conversation warmly
- When ending, include the exact string [SESSION_COMPLETE] at the end of your message
- Always address the student by their name if provided`

const HINT_SYSTEM_PROMPT = `You are a helpful English tutor. A student is stuck on a lesson exercise. Give them one short, helpful hint without revealing the exact answer.

Keep the hint to 1-2 sentences. Use simple English. Do not include the answer directly.`

const PRONUNCIATION_SYSTEM_PROMPT = `You are evaluating whether a student's spoken response matches the target phrase in a language learning app. The student is a non-native English speaker.

You will receive:
- targetText: what the student was supposed to say
- spokenText: what the speech-to-text engine detected

Evaluate similarity and score from 0-100. Be lenient for minor accent variations and common STT mishearings of correct pronunciation.

Respond ONLY with valid JSON:
{
  "score": number (0-100),
  "passed": boolean (true if score >= 70),
  "feedback": "string (1 sentence, specific and encouraging)"
}`

type MistakeType = 'missing' | 'extra' | 'substitution'

type PronunciationResult = {
  score: number
  passed: boolean
  feedback: string
  normalizedTarget: string
  normalizedSpoken: string
  confidenceBand: 'high' | 'medium' | 'low'
  mistakes: Array<{ type: MistakeType; expected?: string; actual?: string }>
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function confidenceBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

function diffMistakes(target: string, spoken: string): Array<{ type: MistakeType; expected?: string; actual?: string }> {
  const t = target.split(' ').filter(Boolean)
  const s = spoken.split(' ').filter(Boolean)
  const max = Math.max(t.length, s.length)
  const out: Array<{ type: MistakeType; expected?: string; actual?: string }> = []

  for (let i = 0; i < max; i++) {
    const expected = t[i]
    const actual = s[i]
    if (expected && !actual) out.push({ type: 'missing', expected })
    else if (!expected && actual) out.push({ type: 'extra', actual })
    else if (expected !== actual) out.push({ type: 'substitution', expected, actual })
  }

  return out.slice(0, 6)
}

function levenshteinSimilarity(a: string, b: string): number {
  const aL = a.toLowerCase().trim()
  const bL = b.toLowerCase().trim()
  if (aL === bL) return 100

  const matrix: number[][] = []
  for (let i = 0; i <= bL.length; i++) matrix[i] = [i]
  for (let j = 0; j <= aL.length; j++) matrix[0][j] = j

  for (let i = 1; i <= bL.length; i++) {
    for (let j = 1; j <= aL.length; j++) {
      matrix[i][j] = bL[i - 1] === aL[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }

  const maxLen = Math.max(aL.length, bL.length)
  return Math.round((1 - matrix[bL.length][aL.length] / maxLen) * 100)
}

export async function streamCoachResponse(userId: string, messages: Array<{ role: string; content: string }>, res: any): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: COACH_SYSTEM_PROMPT,
    messages: messages.slice(-20) as any,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ delta: chunk.delta.text })}\n\n`)
    }
  }

  res.write('data: [DONE]\n\n')
  res.end()

  await logAIUsage(userId, 'coach')
}

export async function checkGrammar(text: string): Promise<{ hasError: boolean; correctedText: string; explanation: string; errorType: string | null }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: GRAMMAR_CHECK_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(raw)
  } catch {
    return { hasError: false, correctedText: text, explanation: '', errorType: null }
  }
}

export async function warmupChat(userId: string, messages: Array<{ role: string; content: string }>): Promise<{ reply: string; sessionEnded: boolean; xpAwarded: number }> {
  const userTurns = messages.filter((m) => m.role === 'user').length

  let systemPrompt = WARMUP_SYSTEM_PROMPT
  if (userTurns === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } })
    systemPrompt += `\n\nStudent's name: ${user?.displayName || 'there'}`
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: systemPrompt,
    messages: messages as any,
  })

  const replyText = response.content[0].type === 'text' ? response.content[0].text : ''
  const sessionEnded = replyText.includes('[SESSION_COMPLETE]')
  const reply = replyText.replace('[SESSION_COMPLETE]', '').trim()

  if (sessionEnded) {
    await prisma.user.update({ where: { id: userId }, data: { xpTotal: { increment: 10 } } })
    await logAIUsage(userId, 'warmup')
  }

  return { reply, sessionEnded, xpAwarded: sessionEnded ? 10 : 0 }
}

export async function scorePronunciation(userId: string, targetText: string, spokenText: string): Promise<PronunciationResult> {
  const normalizedTarget = normalizeText(targetText)
  const normalizedSpoken = normalizeText(spokenText)

  const words = normalizedTarget.split(' ').filter(Boolean).length
  const quickScore = levenshteinSimilarity(normalizedTarget, normalizedSpoken)

  if (words <= 3 && (quickScore >= 80 || quickScore < 50)) {
    await logAIUsage(userId, 'pronunciation')
    return {
      score: quickScore,
      passed: quickScore >= 70,
      feedback: quickScore >= 70 ? 'Great pronunciation!' : `Try again. The correct word is "${targetText}".`,
      normalizedTarget,
      normalizedSpoken,
      confidenceBand: confidenceBand(quickScore),
      mistakes: diffMistakes(normalizedTarget, normalizedSpoken),
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: PRONUNCIATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify({ targetText, spokenText }) }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  let parsed: { score?: number; passed?: boolean; feedback?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }

  const score = typeof parsed.score === 'number' ? parsed.score : quickScore
  const passed = typeof parsed.passed === 'boolean' ? parsed.passed : score >= 70
  const feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
    ? parsed.feedback
    : (passed ? 'Great pronunciation!' : `Try again. The correct phrase is "${targetText}".`)

  await logAIUsage(userId, 'pronunciation')

  return {
    score,
    passed,
    feedback,
    normalizedTarget,
    normalizedSpoken,
    confidenceBand: confidenceBand(score),
    mistakes: diffMistakes(normalizedTarget, normalizedSpoken),
  }
}

export async function getHint(userId: string, gameType: string, cardContent: Record<string, any>): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    system: HINT_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Game type: ${gameType}\nCard content: ${JSON.stringify(cardContent)}\nPlease give a helpful hint.`,
    }],
  })

  const hint = response.content[0].type === 'text' ? response.content[0].text : 'Think carefully about the context!'
  await logAIUsage(userId, 'hint')
  return hint
}
