import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { adminService } from './admin.service'

export class AdminController {
  async listUsers(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.listUsers(req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const adminController = new AdminController()
