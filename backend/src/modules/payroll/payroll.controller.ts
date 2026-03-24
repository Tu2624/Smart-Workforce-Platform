import { Request, Response, NextFunction } from 'express'
import * as svc from './payroll.service'
import { calculatePayrollSchema } from './payroll.schema'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payrolls = await svc.getStudentPayroll(req.user!.id, req.query as Record<string, string>)
    res.json({ payrolls })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payroll = await svc.getPayrollDetail(req.params.id, req.user!.id)
    res.json({ payroll })
  } catch (err) { next(err) }
}

export async function calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { period_start, period_end } = calculatePayrollSchema.parse(req.body)
    const payrolls = await svc.calculatePayroll(req.user!.id, period_start, period_end)
    res.json({ payrolls })
  } catch (err) { next(err) }
}

export async function confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payroll = await svc.confirmPayroll(req.params.id, req.user!.id)
    res.json({ payroll })
  } catch (err) { next(err) }
}

export async function markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payroll = await svc.markPaid(req.params.id, req.user!.id)
    res.json({ payroll })
  } catch (err) { next(err) }
}
