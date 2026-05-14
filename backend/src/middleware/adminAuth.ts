import { Request, Response, NextFunction } from 'express'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  next()
}
