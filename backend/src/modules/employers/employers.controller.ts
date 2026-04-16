import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { employersService } from './employers.service'

export class EmployersController {
  async createEmployee(req: AuthRequest, res: Response) {
    try {
      const result = await employersService.createEmployee(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists',
        })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async listEmployees(req: AuthRequest, res: Response) {
    try {
      const result = await employersService.listEmployees(req.user!.id)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const result = await employersService.getStats(req.user!.id)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }
}

export const employersController = new EmployersController()
