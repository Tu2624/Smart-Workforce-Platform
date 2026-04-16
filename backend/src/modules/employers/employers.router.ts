import { Router } from 'express'
import { employersController } from './employers.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createEmployeeSchema } from './employers.schema'

const router = Router()

router.get('/stats', authMiddleware, roleGuard('employer'), employersController.getStats)
router.get('/employees', authMiddleware, roleGuard('employer'), employersController.listEmployees)

router.post(
  '/employees',
  authMiddleware,
  roleGuard('employer'),
  validate(createEmployeeSchema),
  employersController.createEmployee
)

export { router as employersRouter }
