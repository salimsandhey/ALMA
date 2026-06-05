import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

const DEFAULT_TERMS = [
  { title: '1. Acceptance', body: 'By using ALMA you agree to these Terms. If you do not agree, please stop using the app.' },
  { title: '2. Who can use ALMA', body: 'ALMA is intended for students and trainers involved in hospitality education programmes. Users must be at least 13 years of age.' },
  { title: '3. Your Account', body: 'You are responsible for keeping your login credentials secure. Do not share your account with others.' },
  { title: '4. Acceptable Use', body: 'Do not misuse ALMA. This includes no harmful, abusive, or illegal content. Violations may result in account suspension.' },
  { title: '5. Intellectual Property', body: 'All ALMA content, modules, and AI responses are owned by or licensed to the ALMA platform. You may not copy or redistribute them.' },
  { title: '6. Disclaimers', body: 'ALMA is an educational tool. We do not guarantee employment outcomes. Content is provided as-is.' },
  { title: '7. Changes', body: 'We may update these terms. Continued use after changes means you accept the new terms.' },
]

const DEFAULT_PRIVACY = [
  { title: 'What we collect', body: 'We collect your name, email, age, gender, native language, and learning progress to personalise your experience.' },
  { title: 'How we use it', body: 'Your data is used solely to deliver and improve ALMA. We do not sell your data to third parties.' },
  { title: 'Data storage', body: 'Data is stored securely using industry-standard infrastructure with standard encryption practices.' },
  { title: 'Voice data', body: 'Speech recognition is processed locally on your device. We do not store audio recordings.' },
  { title: 'Your rights', body: 'You can request deletion of your account and data at any time via the Edit Profile page.' },
  { title: 'Cookies', body: 'We use minimal session cookies required for authentication only.' },
  { title: 'Contact', body: "For privacy concerns, contact your programme administrator or reach out via the app's feedback form." },
]

// GET /api/legal — public, no auth needed
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [termsRecord, privacyRecord] = await Promise.all([
      prisma.legalContent.findUnique({ where: { type: 'terms' } }),
      prisma.legalContent.findUnique({ where: { type: 'privacy' } }),
    ])

    res.json({
      terms: {
        sections: (termsRecord?.sections as any[]) ?? DEFAULT_TERMS,
        updatedAt: termsRecord?.updatedAt ?? null,
      },
      privacy: {
        sections: (privacyRecord?.sections as any[]) ?? DEFAULT_PRIVACY,
        updatedAt: privacyRecord?.updatedAt ?? null,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export { DEFAULT_TERMS, DEFAULT_PRIVACY }
export default router
