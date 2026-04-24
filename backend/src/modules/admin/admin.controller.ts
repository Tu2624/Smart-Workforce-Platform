import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { adminService } from './admin.service'

export class AdminController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.getStats()
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listUsers(req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async createEmployer(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.createEmployer(req.body)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'EMAIL_TAKEN') return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email đã được sử dụng' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.toggleUserStatus(req.params.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const adminController = new AdminController()
