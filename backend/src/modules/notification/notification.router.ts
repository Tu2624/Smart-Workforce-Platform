import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import * as ctrl from './notification.controller'

const router = Router()
router.use(authMiddleware)

router.get('/', ctrl.list)
router.patch('/:id/read', ctrl.markRead)
router.patch('/read-all', ctrl.markAllRead)

export default router
