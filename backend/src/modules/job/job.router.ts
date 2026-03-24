import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { roleGuard } from '../../middleware/roleGuard'
import * as ctrl from './job.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', roleGuard('employer'), ctrl.create)
router.put('/:id', roleGuard('employer'), ctrl.update)
router.delete('/:id', roleGuard('employer'), ctrl.remove)
router.patch('/:id/status', roleGuard('employer'), ctrl.patchStatus)

export default router
