import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { payrollService } from './payroll.service'

export class PayrollController {
  async listMine(req: AuthRequest, res: Response) {
    try {
      const result = await payrollService.listStudentPayroll(req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async listEmployer(req: AuthRequest, res: Response) {
    try {
      const result = await payrollService.listEmployerPayroll(req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getDetail(req: AuthRequest, res: Response) {
    try {
      const result = await payrollService.getPayrollDetail(req.params.id, req.user!.id, req.user!.role)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async confirm(req: AuthRequest, res: Response) {
    try {
      const result = await payrollService.updateStatus(req.params.id, req.user!.id, 'confirmed')
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' })
      if (err.message === 'INVALID_TRANSITION') return res.status(400).json({ error: 'INVALID_TRANSITION', message: 'Cannot confirm this payroll' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async exportExcel(req: AuthRequest, res: Response) {
    try {
      const buffer = await payrollService.exportExcel(req.params.id, req.user!.id, req.user!.role)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="payroll-${req.params.id}.xlsx"`)
      res.send(buffer)
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async markPaid(req: AuthRequest, res: Response) {
    try {
      const result = await payrollService.updateStatus(req.params.id, req.user!.id, 'paid')
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' })
      if (err.message === 'INVALID_TRANSITION') return res.status(400).json({ error: 'INVALID_TRANSITION', message: 'Cannot mark this payroll as paid' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const payrollController = new PayrollController()
