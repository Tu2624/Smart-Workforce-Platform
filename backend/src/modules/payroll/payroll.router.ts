import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './payroll.controller'

const router = Router()
router.use(authMiddleware)

router.get('/', roleGuard('student'), ctrl.list)
router.get('/:id', ctrl.getDetail)
router.post('/calculate', roleGuard('employer'), ctrl.calculate)
router.patch('/:id/confirm', roleGuard('employer'), ctrl.confirm)
router.patch('/:id/paid', roleGuard('employer'), ctrl.markPaid)

export default router
