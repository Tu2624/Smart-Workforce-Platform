import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './report.controller'

const router = Router()
router.use(authMiddleware, roleGuard('employer'))

router.get('/overview', ctrl.overview)
router.get('/shifts', ctrl.shiftStats)
router.get('/performance', ctrl.performance)
router.get('/payroll-summary', ctrl.payrollSummary)

export default router
