import { Router } from 'express'
import { reportsController } from './reports.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'

const router = Router()

router.get('/overview',        authMiddleware, roleGuard('employer'), reportsController.getOverview)
router.get('/payroll-summary', authMiddleware, roleGuard('employer'), reportsController.getPayrollSummary)
router.get('/performance',     authMiddleware, roleGuard('employer'), reportsController.getPerformance)
router.get('/shifts',          authMiddleware, roleGuard('employer'), reportsController.getShiftStats)

export { router as reportsRouter }
