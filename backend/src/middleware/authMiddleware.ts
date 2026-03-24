import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  id: string
  email: string
  role: 'student' | 'employer' | 'admin'
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token is invalid or expired' })
  }
}
