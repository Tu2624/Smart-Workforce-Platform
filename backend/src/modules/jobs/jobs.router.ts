import { Router } from 'express'
import { jobsController } from './jobs.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createJobSchema, updateJobSchema, updateJobStatusSchema } from './jobs.schema'

const router = Router()

router.post('/', authMiddleware, roleGuard('employer'), validate(createJobSchema), jobsController.create)
router.get('/', authMiddleware, roleGuard('employer', 'student', 'admin'), jobsController.list)
router.get('/:id', authMiddleware, roleGuard('employer', 'student', 'admin'), jobsController.getOne)
router.put('/:id', authMiddleware, roleGuard('employer'), validate(updateJobSchema), jobsController.update)
router.patch('/:id/status', authMiddleware, roleGuard('employer'), validate(updateJobStatusSchema), jobsController.updateStatus)
router.delete('/:id', authMiddleware, roleGuard('employer'), jobsController.remove)

export { router as jobsRouter }
