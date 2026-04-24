import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { ratingsService } from './ratings.service'

export class RatingsController {
  async create(req: AuthRequest, res: Response) {
    try {
      const result = await ratingsService.createRating(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_ELIGIBLE') return res.status(400).json({ error: 'SHIFT_NOT_ELIGIBLE', message: 'Ca chưa hoàn thành hoặc không thuộc bạn' })
      if (err.message === 'STUDENT_NOT_IN_SHIFT') return res.status(400).json({ error: 'STUDENT_NOT_IN_SHIFT', message: 'Sinh viên không tham gia ca này' })
      if (err.message === 'ALREADY_RATED') return res.status(409).json({ error: 'ALREADY_RATED', message: 'Đã đánh giá sinh viên này trong ca này rồi' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async listByStudent(req: AuthRequest, res: Response) {
    try {
      const result = await ratingsService.listStudentRatings(req.params.studentId)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const ratingsController = new RatingsController()
