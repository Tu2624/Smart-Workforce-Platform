import { Router } from 'express'
import { payrollController } from './payroll.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'

const router = Router()

router.get('/',              authMiddleware, roleGuard('student'), payrollController.listMine)
router.get('/employer',      authMiddleware, roleGuard('employer'), payrollController.listEmployer)
router.get('/:id',           authMiddleware, roleGuard('student', 'employer'), payrollController.getDetail)
router.patch('/:id/confirm', authMiddleware, roleGuard('employer'), payrollController.confirm)
router.patch('/:id/paid',    authMiddleware, roleGuard('employer'), payrollController.markPaid)

export { router as payrollRouter }
