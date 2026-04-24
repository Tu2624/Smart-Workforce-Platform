import { Router } from 'express'
import { adminController } from './admin.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { listUsersSchema } from './admin.schema'

const router = Router()

router.get('/stats',                  authMiddleware, roleGuard('admin'), adminController.getStats)
router.get('/users',                  authMiddleware, roleGuard('admin'), validate(listUsersSchema), adminController.listUsers)
router.post('/employers',                authMiddleware, roleGuard('admin'), adminController.createEmployer)
router.patch('/users/:id/toggle-status', authMiddleware, roleGuard('admin'), adminController.toggleUserStatus)

export { router as adminRouter }
