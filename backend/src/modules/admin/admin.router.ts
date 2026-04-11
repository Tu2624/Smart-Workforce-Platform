import { Router } from 'express'
import { adminController } from './admin.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { listUsersSchema } from './admin.schema'

const router = Router()

router.get('/users', authMiddleware, roleGuard('admin'), validate(listUsersSchema), adminController.listUsers)

export { router as adminRouter }
