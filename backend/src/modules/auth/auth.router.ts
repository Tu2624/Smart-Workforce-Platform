import { Router } from 'express'
import { authController } from './auth.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { loginSchema, registerEmployerSchema, changePasswordSchema, updateProfileSchema } from './auth.schema'

const router = Router()

router.post('/register', validate(registerEmployerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)

// Protected routes
router.get('/me', authMiddleware, authController.getMe)
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile)
router.put('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword)

export { router as authRouter }
