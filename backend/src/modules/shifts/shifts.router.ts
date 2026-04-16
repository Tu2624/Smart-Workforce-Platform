import { Router } from 'express'
import { shiftsController } from './shifts.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createShiftSchema, updateShiftSchema } from './shifts.schema'

const router = Router()

router.post('/', authMiddleware, roleGuard('employer'), validate(createShiftSchema), shiftsController.create)
router.get('/my-stats', authMiddleware, roleGuard('student'), shiftsController.myStats)
router.get('/', authMiddleware, roleGuard('employer', 'student', 'admin'), shiftsController.list)
router.get('/:id', authMiddleware, roleGuard('employer', 'student', 'admin'), shiftsController.getOne)
router.put('/:id', authMiddleware, roleGuard('employer'), validate(updateShiftSchema), shiftsController.update)
router.delete('/:id', authMiddleware, roleGuard('employer'), shiftsController.remove)

router.post('/:id/register',   authMiddleware, roleGuard('student'), shiftsController.register)
router.delete('/:id/register', authMiddleware, roleGuard('student'), shiftsController.cancelRegistration)

router.get('/:id/registrations',             authMiddleware, roleGuard('employer'), shiftsController.listRegistrations)
router.patch('/:id/registrations/:reg_id',   authMiddleware, roleGuard('employer'), shiftsController.reviewRegistration)

export { router as shiftsRouter }
