import { Request, Response } from 'express'
import { authService } from './auth.service'
import { AuthRequest } from '../../middlewares/auth.middleware'

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.registerEmployer(req.body)
      res.status(201).json(result)
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          error: 'EMAIL_ALREADY_EXISTS', 
          message: 'This email is already registered' 
        })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)
      res.status(200).json(result)
    } catch (error: any) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ 
          error: 'INVALID_CREDENTIALS', 
          message: 'Invalid email or password' 
        })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      const result = await authService.getMe(req.user!.id, req.user!.role)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const result = await authService.updateProfile(req.user!.id, req.user!.role, req.body)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { current_password, new_password } = req.body
      await authService.changePassword(req.user!.id, current_password, new_password)
      res.status(200).json({ message: 'Password updated successfully' })
    } catch (error: any) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        return res.status(400).json({ 
          error: 'INVALID_CURRENT_PASSWORD', 
          message: 'Current password is incorrect' 
        })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }
}

export const authController = new AuthController()
