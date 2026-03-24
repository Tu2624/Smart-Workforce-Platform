import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import * as ctrl from './auth.controller'

const router = Router()

router.post('/register', ctrl.register)
router.post('/login', ctrl.login)
router.get('/me', authMiddleware, ctrl.getMe)
router.put('/profile', authMiddleware, ctrl.updateProfile)
router.put('/change-password', authMiddleware, ctrl.changePassword)

export default router
