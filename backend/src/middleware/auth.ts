import { Request, Response, NextFunction } from 'express'
import { verifyToken, JWTPayload } from '../lib/jwt'

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided', code: 'UNAUTHORIZED' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
