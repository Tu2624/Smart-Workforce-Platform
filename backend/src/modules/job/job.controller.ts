import { Request, Response, NextFunction } from 'express'
import * as jobService from './job.service'
import { createJobSchema, updateJobSchema, patchStatusSchema } from './job.schema'

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createJobSchema.parse(req.body)
    const job = await jobService.createJob(req.user!.id, input)
    res.status(201).json({ job })
  } catch (err) { next(err) }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page, limit } = req.query
    const jobs = await jobService.listJobs(req.user!.role, req.user!.id, {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    })
    res.json({ jobs })
  } catch (err) { next(err) }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await jobService.getJobById(req.params.id)
    res.json({ job })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateJobSchema.parse(req.body)
    const job = await jobService.updateJob(req.params.id, req.user!.id, input)
    res.json({ job })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await jobService.deleteJob(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function patchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = patchStatusSchema.parse(req.body)
    const job = await jobService.patchStatus(req.params.id, req.user!.id, input)
    res.json({ job })
  } catch (err) { next(err) }
}
