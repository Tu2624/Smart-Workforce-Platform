import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { notificationService } from './notification.service'

export class NotificationController {
  async list(req: AuthRequest, res: Response) {
    try {
      const result = await notificationService.listNotifications(req.user!.id, req.query)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async markRead(req: AuthRequest, res: Response) {
    try {
      const result = await notificationService.markRead(req.params.id, req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' })
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      const result = await notificationService.markAllRead(req.user!.id)
      res.status(200).json(result)
    } catch (err: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message })
    }
  }
}

export const notificationController = new NotificationController()
