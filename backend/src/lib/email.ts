import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.FROM_EMAIL || 'noreply@alma-app.com'

export async function sendOTPEmail(to: string, code: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<void> {
  const subject = purpose === 'EMAIL_VERIFICATION'
    ? 'Verify your ALMA account'
    : 'Reset your ALMA password'

  const bodyText = purpose === 'EMAIL_VERIFICATION'
    ? `Your ALMA verification code is: ${code}\n\nThis code expires in 10 minutes.`
    : `Your ALMA password reset code is: ${code}\n\nThis code expires in 10 minutes.`

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    text: bodyText,
  })
}
