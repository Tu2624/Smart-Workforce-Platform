import { Router } from 'express'
import { notificationController } from './notification.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'

const router = Router()

router.get('/', authMiddleware, roleGuard('student', 'employer', 'admin'), notificationController.list)
router.patch('/read-all', authMiddleware, roleGuard('student', 'employer', 'admin'), notificationController.markAllRead)
router.patch('/:id/read', authMiddleware, roleGuard('student', 'employer', 'admin'), notificationController.markRead)

export { router as notificationRouter }
