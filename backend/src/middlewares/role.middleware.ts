import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

export const roleGuard = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Authentication required' 
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You do not have permission to access this resource' 
      })
    }

    next()
  }
}
