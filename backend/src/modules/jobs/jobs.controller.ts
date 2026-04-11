import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { jobsService } from './jobs.service'

export class JobsController {
  async create(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.createJob(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.listJobs(req.user!.role, req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async getOne(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.getJob(req.params.id, req.user!.role, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Job not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this job' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.updateJob(req.params.id, req.user!.id, req.body)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Job not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this job' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.updateJobStatus(req.params.id, req.user!.id, req.body.status)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Job not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this job' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const result = await jobsService.deleteJob(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'JOB_NOT_FOUND') return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Job not found' })
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not own this job' })
      if (err.message === 'CANNOT_DELETE_JOB') return res.status(400).json({ error: 'CANNOT_DELETE_JOB', message: 'Cannot delete job with active shifts' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const jobsController = new JobsController()
