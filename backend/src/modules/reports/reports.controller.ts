import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { reportsService } from './reports.service'

export class ReportsController {
  async getOverview(req: AuthRequest, res: Response) {
    try {
      const result = await reportsService.getOverview(req.user!.id)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getPayrollSummary(req: AuthRequest, res: Response) {
    try {
      const result = await reportsService.getPayrollSummary(req.user!.id)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getPerformance(req: AuthRequest, res: Response) {
    try {
      const result = await reportsService.getPerformance(req.user!.id)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getShiftStats(req: AuthRequest, res: Response) {
    try {
      const result = await reportsService.getShiftStats(req.user!.id)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const reportsController = new ReportsController()
