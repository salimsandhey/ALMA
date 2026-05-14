import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  role: string
  email: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function signResetToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '15m' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function verifyResetToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET) as any
  if (payload.purpose !== 'password_reset') throw new Error('Invalid token purpose')
  return { userId: payload.userId }
}
