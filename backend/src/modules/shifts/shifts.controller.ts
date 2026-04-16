import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { shiftsService } from './shifts.service'

export class ShiftsController {
  async create(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.createShift(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Job not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this job' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.listShifts(req.user!.role, req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getOne(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.getShift(req.params.id, req.user!.role, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') return res.status(404).json({ error: 'SHIFT_NOT_FOUND', message: 'Shift not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this shift' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.updateShift(req.params.id, req.user!.id, req.body)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') return res.status(404).json({ error: 'SHIFT_NOT_FOUND', message: 'Shift not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this shift' })
      if (err.message === 'CANNOT_EDIT_SHIFT') return res.status(400).json({ error: 'CANNOT_EDIT_SHIFT', message: "Can only edit shifts with status 'open'" })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.deleteShift(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') return res.status(404).json({ error: 'SHIFT_NOT_FOUND', message: 'Shift not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this shift' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async listRegistrations(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.listRegistrations(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') return res.status(404).json({ error: 'SHIFT_NOT_FOUND', message: 'Shift not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this shift' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async reviewRegistration(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.reviewRegistration(req.params.id, req.params.reg_id, req.user!.id, req.body.status)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        SHIFT_NOT_FOUND:       [404, 'Shift not found'],
        FORBIDDEN:             [403, 'You do not own this shift'],
        REGISTRATION_NOT_FOUND:[404, 'Registration not found'],
        ALREADY_REVIEWED:      [409, 'Registration already reviewed'],
        SHIFT_FULL:            [409, 'Shift is already full'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }

  async myStats(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.getStudentDashboardStats(req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async register(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.registerShift(req.params.id, req.user!.id)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') return res.status(404).json({ error: 'SHIFT_NOT_FOUND', message: 'Shift not found' })
      if (err.message === 'SHIFT_NOT_OPEN') return res.status(400).json({ error: 'SHIFT_NOT_OPEN', message: 'This shift is not open for registration' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You cannot register for shifts outside your employer' })
      if (err.message === 'SHIFT_FULL') return res.status(409).json({ error: 'SHIFT_FULL', message: 'This shift is already full' })
      if (err.message === 'ALREADY_REGISTERED') return res.status(409).json({ error: 'ALREADY_REGISTERED', message: 'You have already registered for this shift' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async cancelRegistration(req: AuthRequest, res: Response) {
    try {
      const result = await shiftsService.cancelRegistration(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'REGISTRATION_NOT_FOUND') return res.status(404).json({ error: 'REGISTRATION_NOT_FOUND', message: 'No pending registration found for this shift' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const shiftsController = new ShiftsController()
