import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

const DEFAULT_TERMS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using ALMA, you agree to these Terms of Use. If you do not agree, please do not use the app.',
  },
  {
    title: '2. What ALMA Is',
    body: 'ALMA is an AI-powered English learning app built for tourism and hospitality workers. It offers structured lessons and modules, interactive games (flashcards, word match, fill-in-the-blank, dialogue practice, image-speak), karaoke-based pronunciation practice, daily challenges, an AI conversation coach, grammar checking, and a leaderboard to track progress against other learners.',
  },
  {
    title: '3. Eligibility & Creating an Account',
    body: 'You must be at least 13 years old to use ALMA. You can sign up with an email address (verified with a one-time code) or sign in with Google or Apple. You are responsible for providing accurate account information.',
  },
  {
    title: '4. Your Account & Security',
    body: 'You are responsible for keeping your login credentials secure and for all activity under your account. Do not share your account with others. Notify us immediately if you suspect unauthorized access.',
  },
  {
    title: '5. Acceptable Use',
    body: 'Do not misuse ALMA. This includes submitting harmful, abusive, hateful, or illegal content through the AI coach, feedback forms, or profile fields; attempting to abuse or overload the AI or speech-scoring features; or attempting to access other users’ accounts or data. Violations may result in warnings, suspension, or account termination.',
  },
  {
    title: '6. AI Features & Their Limits',
    body: 'ALMA uses Google’s Gemini AI to power the conversation coach, grammar checking, pronunciation scoring, and daily greetings, and Google Cloud Text-to-Speech to generate spoken audio for lessons. AI-generated feedback, scores, and corrections are provided for learning purposes only, may occasionally be inaccurate or incomplete, and should not be treated as professional linguistic, legal, or educational certification.',
  },
  {
    title: '7. Speech & Voice Features',
    body: 'Karaoke and pronunciation exercises use your device’s built-in speech recognition to convert your spoken voice into text on your device. Only that recognized text — never a recording of your voice — is sent to our servers for scoring and feedback.',
  },
  {
    title: '8. Leaderboards & Visibility to Other Users',
    body: 'Your display name, avatar, country, and XP total may be visible to other students on the in-app leaderboard. Do not include personal or sensitive information in your display name or avatar.',
  },
  {
    title: '9. Intellectual Property',
    body: 'All ALMA lessons, modules, games, karaoke content, and app design are owned by or licensed to the ALMA platform. You may not copy, redistribute, or reverse-engineer this content. AI-generated responses shown to you are for your personal learning use only.',
  },
  {
    title: '10. Third-Party Services',
    body: 'ALMA relies on third-party providers to operate: Google (Gemini AI, Cloud Text-to-Speech, Google Sign-In), Apple (Sign in with Apple), Cloudinary (storing images and audio), and Resend (delivering verification and account emails). Your use of ALMA is also subject to the availability of these services.',
  },
  {
    title: '11. Account Termination',
    body: 'Accounts that remain unverified (email not confirmed) for more than 24 hours are automatically deleted. We may suspend or terminate accounts that violate these Terms. You may request deletion of your account at any time.',
  },
  {
    title: '12. Disclaimers',
    body: 'ALMA is an educational tool. We do not guarantee specific learning outcomes, certifications, or employment results. Content, AI feedback, and scores are provided “as is” without warranty of any kind.',
  },
  {
    title: '13. Changes to These Terms',
    body: 'We may update these Terms from time to time. Continuing to use ALMA after changes are published means you accept the updated Terms.',
  },
  {
    title: '14. Contact',
    body: 'Questions about these Terms can be sent through the in-app feedback form or to your programme administrator.',
  },
]

const DEFAULT_PRIVACY = [
  {
    title: '1. Information We Collect',
    body: 'Account information: email address, display name, password (encrypted, never stored in plain text), and optionally age, gender, native language, country, and a profile photo. If you sign in with Google or Apple, we receive your account identifier from that provider. Learning data: lesson and module progress, XP, streaks, badges earned, daily challenge and entertainment activity, and AI usage counts. Support data: any messages you submit through the in-app feedback form.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to operate your account, track and personalize your learning progress, power gamification features (XP, streaks, badges, leaderboard), respond to feedback, and improve ALMA. We do not sell your personal data to third parties.',
  },
  {
    title: '3. AI Processing',
    body: 'When you use the AI coach, grammar check, pronunciation scoring, or daily greeting features, the relevant text (your messages, recognized speech, or lesson content) is sent to Google’s Gemini AI to generate a response or score. Generated speech audio is created using Google Cloud Text-to-Speech. We log the number of tokens used per feature for cost and abuse monitoring, not the content of every conversation.',
  },
  {
    title: '4. Voice & Speech Data',
    body: 'Speech recognition during karaoke and pronunciation exercises happens on your device using your device’s built-in speech-to-text engine. We do not receive or store recordings of your voice — only the resulting recognized text is sent to our servers for scoring.',
  },
  {
    title: '5. Information Visible to Other Users',
    body: 'Your display name, profile photo, country, and total XP appear on the in-app leaderboard, visible to other students using ALMA.',
  },
  {
    title: '6. Third-Party Service Providers',
    body: 'We use trusted providers to run ALMA: Google (Gemini AI, Cloud Text-to-Speech, Google Sign-In), Apple (Sign in with Apple), Cloudinary (secure storage of profile photos, lesson images, and audio files), and Resend (sending email verification codes and account-related emails). Each provider processes data only as needed to provide their service to us.',
  },
  {
    title: '7. Data Storage & Security',
    body: 'Your data is stored in a PostgreSQL database with industry-standard security practices. Passwords are hashed with bcrypt and are never stored or transmitted in plain text. Your session is authenticated using a securely stored access token on your device.',
  },
  {
    title: '8. Data Retention',
    body: 'If you create an account but never verify your email, that account and its data are automatically deleted after 24 hours. If you delete your account, we remove your personal data other than what we’re required to retain for legal or accounting purposes.',
  },
  {
    title: '9. Your Rights',
    body: 'You can review and update your profile information at any time from the Edit Profile screen. You can request deletion of your account and associated data at any time by contacting us or your programme administrator.',
  },
  {
    title: '10. Children’s Privacy',
    body: 'ALMA is intended for users aged 13 and older who are participating in hospitality/tourism English-learning programmes. We do not knowingly collect data from children under 13.',
  },
  {
    title: '11. Cookies & Local Storage',
    body: 'The ALMA mobile app does not use web cookies or advertising trackers. It stores your login session securely on your device to keep you signed in, and caches lesson audio locally to enable offline playback. These legal pages on the web use no cookies or tracking scripts.',
  },
  {
    title: '12. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Continuing to use ALMA after changes are published means you accept the updated policy.',
  },
  {
    title: '13. Contact Us',
    body: 'For privacy questions or data requests, contact us through the in-app feedback form or reach out to your programme administrator.',
  },
]

export async function getLegalContent() {
  const [termsRecord, privacyRecord] = await Promise.all([
    prisma.legalContent.findUnique({ where: { type: 'terms' } }),
    prisma.legalContent.findUnique({ where: { type: 'privacy' } }),
  ])

  return {
    terms: {
      sections: (termsRecord?.sections as any[]) ?? DEFAULT_TERMS,
      updatedAt: termsRecord?.updatedAt ?? null,
    },
    privacy: {
      sections: (privacyRecord?.sections as any[]) ?? DEFAULT_PRIVACY,
      updatedAt: privacyRecord?.updatedAt ?? null,
    },
  }
}

// GET /api/legal — public, no auth needed
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await getLegalContent())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export { DEFAULT_TERMS, DEFAULT_PRIVACY }
export default router
