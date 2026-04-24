import { Router } from 'express'
import { ratingsController } from './ratings.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleGuard } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createRatingSchema } from './ratings.schema'

const router = Router()

router.post('/',                      authMiddleware, roleGuard('employer'), validate(createRatingSchema), ratingsController.create)
router.get('/student/:studentId',     authMiddleware, roleGuard('employer', 'admin', 'student'), ratingsController.listByStudent)

export { router as ratingsRouter }
