import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './attendance.controller'

const router = Router()
router.use(authMiddleware)

router.post('/checkin', roleGuard('student'), ctrl.checkIn)
router.post('/checkout', roleGuard('student'), ctrl.checkOut)
router.get('/', roleGuard('student'), ctrl.history)
router.get('/shift/:shift_id', roleGuard('employer'), ctrl.shiftAttendance)

export default router
