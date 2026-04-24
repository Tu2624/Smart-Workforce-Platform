import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { jobsService } from './jobs.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { AppError } from '../../utils/appError'

export class JobsController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await jobsService.createJob(req.user!.id, req.body)
    res.status(201).json(result)
  })

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await jobsService.listJobs(req.user!.role, req.user!.id, req.query)
    res.status(200).json(result)
  })

  getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await jobsService.getJob(req.params.id, req.user!.role, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') throw new AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không có quyền truy cập công việc này', 'FORBIDDEN')
      throw err
    }
  })

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await jobsService.updateJob(req.params.id, req.user!.id, req.body)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') throw new AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN')
      throw err
    }
  })

  updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await jobsService.updateJobStatus(req.params.id, req.user!.id, req.body.status)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') throw new AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN')
      throw err
    }
  })

  remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const result = await jobsService.deleteJob(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') throw new AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND')
      if (err.message === 'FORBIDDEN') throw new AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN')
      if (err.message === 'CANNOT_DELETE_JOB') throw new AppError(400, 'Không thể xóa công việc có ca làm việc đang hoạt động', 'CANNOT_DELETE_JOB')
      throw err
    }
  })
}

export const jobsController = new JobsController()
