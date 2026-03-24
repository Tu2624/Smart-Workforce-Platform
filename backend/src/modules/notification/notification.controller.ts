import { Request, Response, NextFunction } from 'express'
import * as svc from './notification.service'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await svc.getNotifications(req.user!.id, req.query as Record<string, string>)
    res.json({ notifications })
  } catch (err) { next(err) }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.markRead(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.markAllRead(req.user!.id)
    res.status(204).send()
  } catch (err) { next(err) }
}
