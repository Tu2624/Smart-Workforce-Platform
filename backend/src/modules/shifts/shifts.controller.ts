import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { shiftsService } from './shifts.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/appError'

export class ShiftsController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.createShift(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') throw new AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN')
      throw err
    }
  })

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftsService.listShifts(req.user!.role, req.user!.id, req.query)
    res.status(200).json(result)
  })

  getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.getShift(req.params.id, req.user!.role, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') throw new AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không có quyền truy cập ca làm việc này', 'FORBIDDEN')
      throw err
    }
  })

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.updateShift(req.params.id, req.user!.id, req.body)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') throw new AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN')
      if (err.message === 'CANNOT_EDIT_SHIFT') throw new AppError(400, "Chỉ có thể chỉnh sửa ca làm việc ở trạng thái 'mở'", 'CANNOT_EDIT_SHIFT')
      throw err
    }
  })

  remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.deleteShift(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') throw new AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN')
      throw err
    }
  })

  listRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.listRegistrations(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') throw new AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN')
      throw err
    }
  })

  reviewRegistration = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.reviewRegistration(req.params.id, req.params.reg_id, req.user!.id, req.body.status)
      res.status(200).json(result)
    } catch (err: any) {
      const map: Record<string, [number, string]> = {
        SHIFT_NOT_FOUND:       [404, 'Không tìm thấy ca làm việc'],
        FORBIDDEN:             [403, 'Bạn không sở hữu ca làm việc này'],
        REGISTRATION_NOT_FOUND:[404, 'Không tìm thấy đơn đăng ký'],
        ALREADY_REVIEWED:      [409, 'Đơn đăng ký đã được duyệt trước đó'],
        SHIFT_FULL:            [409, 'Ca làm việc đã đầy'],
      }
      const errorDetail = map[err.message]
      if (errorDetail) {
        throw new AppError(errorDetail[0], errorDetail[1], err.message)
      }
      throw err
    }
  })

  myStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftsService.getStudentDashboardStats(req.user!.id)
    res.status(200).json(result)
  })

  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.registerShift(req.params.id, req.user!.id)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.message === 'SHIFT_NOT_FOUND') throw new AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND')
      if (err.message === 'SHIFT_NOT_OPEN') throw new AppError(400, 'Ca làm việc này không mở đăng ký', 'SHIFT_NOT_OPEN')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không thể đăng ký ca làm việc bên ngoài công ty của mình', 'FORBIDDEN')
      if (err.message === 'SHIFT_FULL') throw new AppError(409, 'Ca làm việc đã đầy', 'SHIFT_FULL')
      if (err.message === 'ALREADY_REGISTERED') throw new AppError(409, 'Bạn đã đăng ký ca làm việc này rồi', 'ALREADY_REGISTERED')
      throw err
    }
  })

  cancelRegistration = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await shiftsService.cancelRegistration(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'REGISTRATION_NOT_FOUND') throw new AppError(404, 'Không tìm thấy đơn đăng ký cho ca làm việc này', 'REGISTRATION_NOT_FOUND')
      throw err
    }
  })
}

export const shiftsController = new ShiftsController()
