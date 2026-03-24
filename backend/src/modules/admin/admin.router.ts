import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './admin.controller'

const router = Router()
router.use(authMiddleware, roleGuard('admin'))

router.get('/users', ctrl.users)
router.patch('/users/:id/toggle-status', ctrl.toggleStatus)
router.get('/jobs', ctrl.jobs)
router.get('/stats', ctrl.stats)

export default router
