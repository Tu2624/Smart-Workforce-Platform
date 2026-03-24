import { Request, Response, NextFunction } from 'express'
import * as svc from './report.service'

export async function overview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getOverview(req.user!.id)
    res.json(data)
  } catch (err) { next(err) }
}

export async function shiftStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from = new Date(Date.now() - 30 * 86400000).toISOString(), to = new Date().toISOString() } = req.query
    const data = await svc.getShiftStats(req.user!.id, from as string, to as string)
    res.json({ data })
  } catch (err) { next(err) }
}

export async function performance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getPerformance(req.user!.id)
    res.json({ data })
  } catch (err) { next(err) }
}

export async function payrollSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getPayrollSummary(req.user!.id)
    res.json({ data })
  } catch (err) { next(err) }
}
