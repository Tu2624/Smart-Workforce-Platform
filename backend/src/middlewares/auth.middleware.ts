import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: 'student' | 'employer' | 'admin'
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'No token provided' 
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_super_secret_key_here'
    ) as { id: string; email: string; role: 'student' | 'employer' | 'admin' }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED_EXPIRED', 
      message: 'Token is invalid or expired' 
    })
  }
}
