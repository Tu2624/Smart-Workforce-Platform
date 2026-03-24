import { Request, Response, NextFunction } from 'express'
import * as svc from './admin.service'

export async function users(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.listUsers(req.query as Record<string, string>)
    res.json({ users: data })
  } catch (err) { next(err) }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await svc.toggleUserStatus(req.params.id)
    res.json({ user })
  } catch (err) { next(err) }
}

export async function jobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.listAllJobs(req.query as Record<string, string>)
    res.json({ jobs: data })
  } catch (err) { next(err) }
}

export async function stats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getSystemStats()
    res.json(data)
  } catch (err) { next(err) }
}
