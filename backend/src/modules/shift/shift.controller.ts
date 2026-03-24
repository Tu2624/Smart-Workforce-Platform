import { Request, Response, NextFunction } from 'express'
import * as shiftService from './shift.service'
import { createShiftSchema, updateShiftSchema, reviewRegistrationSchema } from './shift.schema'

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createShiftSchema.parse(req.body)
    const shift = await shiftService.createShift(req.user!.id, input)
    res.status(201).json({ shift })
  } catch (err) { next(err) }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shifts = await shiftService.listShifts(req.user!.role, req.user!.id, req.query as Record<string, string>)
    res.json({ shifts })
  } catch (err) { next(err) }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shift = await shiftService.getShiftById(req.params.id)
    res.json({ shift })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateShiftSchema.parse(req.body)
    const shift = await shiftService.updateShift(req.params.id, req.user!.id, input)
    res.json({ shift })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await shiftService.deleteShift(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const registration = await shiftService.registerShift(req.params.id, req.user!.id)
    res.status(201).json({ registration })
  } catch (err) { next(err) }
}

export async function getRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const registrations = await shiftService.getRegistrations(req.params.id, req.user!.id)
    res.json({ registrations })
  } catch (err) { next(err) }
}

export async function reviewRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = reviewRegistrationSchema.parse(req.body)
    const reg = await shiftService.reviewRegistration(req.params.id, req.params.reg_id, req.user!.id, input)
    res.json({ registration: reg })
  } catch (err) { next(err) }
}

export async function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await shiftService.cancelRegistration(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) { next(err) }
}
