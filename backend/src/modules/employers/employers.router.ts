import { Router } from 'express'
import { employersController } from './employers.controller'
import { rolesController } from './roles.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createEmployeeSchema, updateEmployeeSchema } from './employers.schema'
import { createRoleSchema, updateRoleSchema } from './roles.schema'

const router = Router()

router.get('/stats', authMiddleware, roleGuard('employer'), employersController.getStats)
router.get('/chart-data', authMiddleware, roleGuard('employer'), employersController.getChartData)
router.get('/employees', authMiddleware, roleGuard('employer'), employersController.listEmployees)

router.post(
  '/employees',
  authMiddleware,
  roleGuard('employer'),
  validate(createEmployeeSchema),
  employersController.createEmployee
)

router.put(
  '/employees/:id',
  authMiddleware,
  roleGuard('employer'),
  validate(updateEmployeeSchema),
  employersController.updateEmployee
)

router.delete(
  '/employees/:id',
  authMiddleware,
  roleGuard('employer'),
  employersController.deleteEmployee
)

// Employer roles CRUD
router.get('/roles', authMiddleware, roleGuard('employer'), rolesController.list)
router.post('/roles', authMiddleware, roleGuard('employer'), validate(createRoleSchema), rolesController.create)
router.put('/roles/:role_id', authMiddleware, roleGuard('employer'), validate(updateRoleSchema), rolesController.update)
router.delete('/roles/:role_id', authMiddleware, roleGuard('employer'), rolesController.remove)

export { router as employersRouter }
