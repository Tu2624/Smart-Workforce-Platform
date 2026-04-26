import { Router } from 'express'
import { attendanceController } from './attendance.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'

const router = Router()

router.post('/checkin',  authMiddleware, roleGuard('student'), attendanceController.checkIn)
router.post('/checkout', authMiddleware, roleGuard('student'), attendanceController.checkOut)
router.get('/',          authMiddleware, roleGuard('student'), attendanceController.listMine)

router.get('/shift/:shift_id',        authMiddleware, roleGuard('employer'), attendanceController.listForShift)
router.post('/manual-checkin',        authMiddleware, roleGuard('employer'), attendanceController.manualCheckIn)
router.post('/manual-checkout',       authMiddleware, roleGuard('employer'), attendanceController.manualCheckOut)
router.patch('/:id/force-complete',   authMiddleware, roleGuard('employer'), attendanceController.forceComplete)
router.patch('/:id',                  authMiddleware, roleGuard('employer'), attendanceController.updateNote)

export { router as attendanceRouter }
