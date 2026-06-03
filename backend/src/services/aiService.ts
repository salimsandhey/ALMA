import genAI from '../lib/gemini'
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
- Focus on hospitality-specific language and module topics when possible
- Be warm, patient, and positive
- Keep responses concise (2-4 sentences for conversational replies)
- Use simple, clear English appropriate for intermediate learners
- Never speak in the student's native language
- Only discuss English learning, hospitality, tourism, and the student's work or daily life
- NEVER share external links, URLs, or website addresses under any circumstances
- NEVER engage with adult, illegal, or abusive content — if asked, respond: "Let's keep our focus on English practice!"
- If the student makes a grammar or spelling error, gently note it AFTER responding. Format as: [Correction: ...]

After each reply, on a new line add a one-line assessment of the student's English:
[FEEDBACK: Your encouraging assessment here — max 10 words, e.g. "Great sentence structure! Very natural phrasing."]`

const GRAMMAR_CHECK_SYSTEM_PROMPT = `You are an extremely strict grammar, spelling, casing, and style checker for English as a Second Language (ESL) learners.
Analyze the given text for any errors, including:
- Capitalization (e.g., lowercase "i" must be capitalized to "I", sentences must start with a capital letter).
- Punctuation (e.g., missing periods, commas, or question marks at the end of sentences).
- Missing or incorrect articles (e.g., "a", "an", "the").
- Prepositions (e.g., "listen to music" instead of "listen music", "arrive at the hotel").
- Subject-verb agreement and verb tenses.
- Spelling and typos.
- Incorrect word order.

Be highly strict. If there are any minor corrections (even just a missing period or a lowercase "i"), set "hasError" to true and provide the corrected text.

Respond ONLY with valid JSON. No other text.

JSON format:
{
  "hasError": boolean,
  "correctedText": "string (corrected version with proper capitalization, spelling, and grammar)",
  "explanation": "string (brief, encouraging explanation in simple English of what was wrong, or empty string if no error)",
  "errorType": "string or null (e.g. VERB_TENSE, SUBJECT_VERB_AGREEMENT, WORD_ORDER, MISSING_ARTICLE, SPELLING, PREPOSITION, CAPITALIZATION, PUNCTUATION)",
  "betterToSay": {
    "original": "string (the exact original phrase that could be expressed more naturally or professionally in hospitality contexts)",
    "corrected": "string (more natural, polite, or idiomatic version)",
    "explanation": "string (encouraging explanation of why this sounds better, 1 sentence)"
  }
}

Set betterToSay to null if the user's expression is already perfectly natural and idiomatic.`

const DAILY_GREETING_SYSTEM_PROMPT = `You are ALMA, a warm and friendly daily check-in companion for English learners in tourism and hospitality.

Your role:
- Start with a warm, casual greeting
- Ask simple daily questions (e.g. "How are you feeling today?", "How was your morning?", "What are your plans for today?")
- Keep every response to 1-2 sentences maximum
- Be very warm, positive, and encouraging
- Address the student by name
- Do NOT correct grammar — this is a friendly daily check-in, not a lesson
- This is a brief interaction to start their day`

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

function isContentPolicyError(err: any): boolean {
  const msg = err?.message?.toLowerCase() || ''
  return err?.status === 400 || msg.includes('content') || msg.includes('policy') || msg.includes('safety') || msg.includes('blocked')
}

type GeminiContent = { role: 'user' | 'model'; parts: [{ text: string }] }

function buildContents(
  messages: Array<{ role: string; content: string }>,
  openingPrompt: string
): GeminiContent[] {
  // Map to Gemini roles
  const mapped: GeminiContent[] = messages.map((m) => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: m.content }],
  }))

  // Collapse consecutive same roles (Gemini requires strict alternation)
  const collapsed: GeminiContent[] = []
  for (const msg of mapped) {
    const last = collapsed[collapsed.length - 1]
    if (last && last.role === msg.role) {
      last.parts[0].text += '\n' + msg.parts[0].text
    } else {
      collapsed.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] })
    }
  }

  // Must start with 'user'
  if (collapsed.length === 0 || collapsed[0].role !== 'user') {
    collapsed.unshift({ role: 'user', parts: [{ text: openingPrompt }] })
  }

  // Must end with 'user' (this is the message we want a response to)
  if (collapsed[collapsed.length - 1].role !== 'user') {
    collapsed.push({ role: 'user', parts: [{ text: openingPrompt }] })
  }

  return collapsed
}

export async function streamCoachResponse(userId: string, messages: Array<{ role: string; content: string }>, res: any): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: COACH_SYSTEM_PROMPT,
    })

    const contents = buildContents(
      messages.slice(-20),
      'Hello, let us start our English practice conversation.'
    )

    const stream = await model.generateContentStream({
      contents,
      generationConfig: { maxOutputTokens: 400 },
    })

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text()
      if (chunkText) res.write(`data: ${JSON.stringify({ delta: chunkText })}\n\n`)
    }

    await logAIUsage(userId, 'coach')
  } catch (err: any) {
    console.error('[streamCoachResponse] error:', err?.message ?? err)
    const fallback = isContentPolicyError(err)
      ? "I'm not able to respond to that. Let's try a different topic!"
      : "I'm having trouble connecting right now. Please try again."
    res.write(`data: ${JSON.stringify({ delta: fallback })}\n\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
}

type BetterToSay = { original: string; corrected: string; explanation: string } | null

type GrammarResult = {
  hasError: boolean
  correctedText: string
  explanation: string
  errorType: string | null
  betterToSay: BetterToSay
}

function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1)
  }
  return text
}

export async function checkGrammar(text: string): Promise<GrammarResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: GRAMMAR_CHECK_SYSTEM_PROMPT,
  })

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: { maxOutputTokens: 1024 },
  })
  const raw = response.response.text().trim()
  console.log('[checkGrammar] raw response:', raw.slice(0, 300))
  const jsonText = extractJson(raw)
  return JSON.parse(jsonText)
}

export async function dailyGreetingChat(
  userId: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ reply: string }> {
  let systemPrompt = DAILY_GREETING_SYSTEM_PROMPT
  const userTurns = messages.filter((m) => m.role === 'user').length

  if (userTurns === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } })
    systemPrompt += `\n\nStudent's name: ${user?.displayName ?? 'there'}`
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    })

    const contents = buildContents(messages, 'Hello, please start our friendly daily greeting check-in.')
    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 300,
        // @ts-ignore — thinkingConfig supported in gemini-2.5-flash
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    return { reply: result.response.text().trim() }
  } catch (err: any) {
    console.error('[dailyGreetingChat] error:', err?.message ?? err)
    return { reply: 'Good morning! How are you feeling today?' }
  }
}

export async function coachChat(
  userId: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ reply: string; feedback: string | null; correction: string | null }> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: COACH_SYSTEM_PROMPT,
    })

    const contents = buildContents(
      messages.slice(-20),
      'Hello, let us start our English practice conversation.'
    )

    const result = await model.generateContent({
      contents,
      generationConfig: { maxOutputTokens: 400 },
    })
    const fullText = result.response.text()

    const feedbackMatch = fullText.match(/\[FEEDBACK:\s*(.+?)\]/i)
    const correctionMatch = fullText.match(/\[Correction:\s*(.+?)\]/i)

    const feedback = feedbackMatch?.[1]?.trim() ?? null
    const correction = correctionMatch?.[1]?.trim() ?? null
    const reply = fullText
      .replace(/\[FEEDBACK:[^\]]*\]/gi, '')
      .replace(/\[Correction:[^\]]*\]/gi, '')
      .trim()

    await logAIUsage(userId, 'coach')
    return { reply, feedback, correction }
  } catch (err: any) {
    console.error('[coachChat] error:', err?.message ?? err)
    if (isContentPolicyError(err)) {
      return { reply: "Let's keep our focus on English practice! What would you like to learn today?", feedback: null, correction: null }
    }
    return { reply: "I'm having trouble connecting right now. Please try again.", feedback: null, correction: null }
  }
}

export async function getCoachStatus(userId: string): Promise<{
  messagesUsed: number
  messagesRemaining: number
  sessionsUsed: number
  sessionsRemaining: number
  canChat: boolean
}> {
  const [msgRaw, sessionRaw] = await Promise.all([
    redis.get(`rl:coach-msg:${userId}`),
    redis.get(`rl:coach-session:${userId}`),
  ])
  const messagesUsed = parseInt((msgRaw as string | null) ?? '0')
  const sessionsUsed = parseInt((sessionRaw as string | null) ?? '0')
  const messagesRemaining = Math.max(0, 50 - messagesUsed)
  const sessionsRemaining = Math.max(0, 2 - sessionsUsed)
  return { messagesUsed, messagesRemaining, sessionsUsed, sessionsRemaining, canChat: messagesRemaining > 0 && sessionsRemaining > 0 }
}

export async function startCoachSession(userId: string): Promise<{ allowed: boolean; sessionsUsed: number }> {
  const key = `rl:coach-session:${userId}`
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, 86400)
  return { allowed: current <= 2, sessionsUsed: current }
}

export async function warmupChat(userId: string, messages: Array<{ role: string; content: string }>): Promise<{ reply: string; sessionEnded: boolean; xpAwarded: number }> {
  const userTurns = messages.filter((m) => m.role === 'user').length

  let systemPrompt = WARMUP_SYSTEM_PROMPT
  if (userTurns === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } })
    systemPrompt += `\n\nStudent's name: ${user?.displayName || 'there'}`
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    })

    const contents = buildContents(messages, 'Hello, please start our 5-turn English warm-up session.')
    const result = await model.generateContent({
      contents,
      generationConfig: { maxOutputTokens: 150 },
    })
    const replyText = result.response.text()

    const sessionEnded = replyText.includes('[SESSION_COMPLETE]')
    const reply = replyText.replace('[SESSION_COMPLETE]', '').trim()

    if (sessionEnded) {
      await prisma.user.update({ where: { id: userId }, data: { xpTotal: { increment: 10 } } })
      await logAIUsage(userId, 'warmup')
    }

    return { reply, sessionEnded, xpAwarded: sessionEnded ? 10 : 0 }
  } catch (err: any) {
    console.error('[warmupChat] error:', err?.message ?? err)
    return { reply: 'Good morning! Ready to start our warm-up conversation?', sessionEnded: false, xpAwarded: 0 }
  }
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

  let parsed: { score?: number; passed?: boolean; feedback?: string } = {}
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: PRONUNCIATION_SYSTEM_PROMPT,
    })

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ targetText, spokenText }) }] }],
      generationConfig: { maxOutputTokens: 150 },
    })

    const raw = response.response.text().trim()
    parsed = JSON.parse(extractJson(raw))
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

type QuizAnswerInput = {
  questionId: string
  question: string
  spokenText: string
  expectedAnswer: string
  keywords: string[]
}

type QuizGradeResult = {
  questionId: string
  correct: boolean
}

export async function gradeQuizAnswersWithAI(answers: QuizAnswerInput[]): Promise<QuizGradeResult[]> {
  if (answers.length === 0) return []

  const lines = answers.map((a, i) =>
    `Q${i + 1} [${a.questionId}]: ${a.question}\nExpected: ${a.expectedAnswer}\nUser said: "${a.spokenText || '(no answer)'}"`
  ).join('\n\n')

  const prompt = `Grade each answer. Reply with ONLY a comma-separated list of 1 (correct) or 0 (wrong), one per question, in order. Nothing else.\n\nExamples of correct: synonyms, paraphrases, partial answers that show understanding.\nExamples of wrong: empty, completely off-topic, opposite meaning.\n\n${lines}`

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are a strict but fair quiz grader for English language learners. Grade answers as correct if they show genuine understanding, even if phrasing differs from the expected answer.',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: answers.length * 3,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const raw = result.response.text().trim()
    const grades = raw.split(',').map((v) => v.trim())

    return answers.map((a, i) => ({
      questionId: a.questionId,
      correct: grades[i] === '1',
    }))
  } catch (err) {
    console.error('[gradeQuizAnswersWithAI] error, falling back to keyword match:', err)
    // Fallback: keyword matching
    return answers.map((a) => ({
      questionId: a.questionId,
      correct: a.spokenText.length > 0 && a.keywords.some((kw) =>
        a.spokenText.toLowerCase().includes(kw.toLowerCase().trim())
      ),
    }))
  }
}

export async function getHint(userId: string, gameType: string, cardContent: Record<string, any>): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: HINT_SYSTEM_PROMPT,
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Game type: ${gameType}\nCard content: ${JSON.stringify(cardContent)}\nPlease give a helpful hint.` }],
      }],
      generationConfig: {
        maxOutputTokens: 100,
      },
    })

    const hint = response.response.text().trim()
    await logAIUsage(userId, 'hint')
    return hint
  } catch {
    return 'Think carefully about the context and what you have learned so far!'
  }
}
