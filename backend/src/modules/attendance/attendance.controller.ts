import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { attendanceService } from './attendance.service'

export class AttendanceController {
  async checkIn(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.checkIn(req.user!.id, req.body.shift_id)
      res.status(201).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        NOT_REGISTERED:    [403, 'You do not have an approved registration for this shift'],
        ALREADY_CHECKED_IN:[409, 'You have already checked in for this shift'],
        SHIFT_NOT_FOUND:   [404, 'Shift not found'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }

  async checkOut(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.checkOut(req.user!.id, req.body.shift_id)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        ATTENDANCE_NOT_FOUND: [404, 'No active attendance record found'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }

  async listMine(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.listStudentAttendance(req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async listForShift(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.listShiftAttendance(req.params.shift_id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        SHIFT_NOT_FOUND: [404, 'Shift not found'],
        FORBIDDEN:       [403, 'You do not own this shift'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }

  async forceComplete(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.forceComplete(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        ATTENDANCE_NOT_FOUND:        [404, 'Attendance record not found'],
        FORBIDDEN:                   [403, 'You do not own this shift'],
        ALREADY_COMPLETED:           [409, 'Student has already checked out'],
        SHIFT_NOT_ENDED:             [400, 'Shift has not ended yet'],
        FORCE_CHECKOUT_LIMIT_EXCEEDED:[403, 'Force checkout limit (3/month) exceeded for this student'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }

  async updateNote(req: AuthRequest, res: Response) {
    try {
      const result = await attendanceService.updateNote(req.params.id, req.user!.id, req.body.note)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        ATTENDANCE_NOT_FOUND: [404, 'Attendance record not found'],
        FORBIDDEN:            [403, 'You do not own this shift'],
      }
      const [status, message] = map[err.message] ?? [500, err.message]
      res.status(status).json({ error: err.message, message })
    }
  }
}

export const attendanceController = new AttendanceController()
