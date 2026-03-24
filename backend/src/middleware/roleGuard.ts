import { Request, Response, NextFunction } from 'express'

type Role = 'student' | 'employer' | 'admin'

export function roleGuard(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' })
      return
    }
    next()
  }
}
