import { Request, Response, NextFunction } from 'express'
import * as svc from './attendance.service'
import { checkInSchema, checkOutSchema } from './attendance.schema'

export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { shift_id } = checkInSchema.parse(req.body)
    const attendance = await svc.checkIn(req.user!.id, shift_id)
    res.status(201).json({ attendance })
  } catch (err) { next(err) }
}

export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { shift_id } = checkOutSchema.parse(req.body)
    const attendance = await svc.checkOut(req.user!.id, shift_id)
    res.json({ attendance })
  } catch (err) { next(err) }
}

export async function history(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await svc.getHistory(req.user!.id, req.query as Record<string, string>)
    res.json({ records })
  } catch (err) { next(err) }
}

export async function shiftAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await svc.getShiftAttendance(req.params.shift_id, req.user!.id)
    res.json({ records })
  } catch (err) { next(err) }
}
