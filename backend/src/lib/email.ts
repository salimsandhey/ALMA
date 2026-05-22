import { Resend } from 'resend'

let _resend: Resend | null = null
const FROM = process.env.FROM_EMAIL || 'noreply@alma-app.com'

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendOTPEmail(to: string, code: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<void> {
  const subject = purpose === 'EMAIL_VERIFICATION'
    ? 'Verify your ALMA account'
    : 'Reset your ALMA password'

  const bodyText = purpose === 'EMAIL_VERIFICATION'
    ? `Your ALMA verification code is: ${code}\n\nThis code expires in 10 minutes.`
    : `Your ALMA password reset code is: ${code}\n\nThis code expires in 10 minutes.`

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    text: bodyText,
  })
}
