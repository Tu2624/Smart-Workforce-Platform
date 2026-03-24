import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './shift.controller'

const router = Router()
router.use(authMiddleware)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', roleGuard('employer'), ctrl.create)
router.put('/:id', roleGuard('employer'), ctrl.update)
router.delete('/:id', roleGuard('employer'), ctrl.remove)

router.post('/:id/register', roleGuard('student'), ctrl.register)
router.delete('/:id/register', roleGuard('student'), ctrl.cancelRegistration)
router.get('/:id/registrations', roleGuard('employer'), ctrl.getRegistrations)
router.patch('/:id/registrations/:reg_id', roleGuard('employer'), ctrl.reviewRegistration)

export default router
