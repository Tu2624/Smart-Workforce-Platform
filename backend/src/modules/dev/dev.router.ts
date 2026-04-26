import { Router, Request, Response } from 'express'
import { getNow, getOffsetMs, setOffsetMs, resetOffset } from '../../utils/serverTime'
import { runWeeklyScheduler } from '../../jobs/weeklyScheduler'

const router = Router()

// Middleware: block in production
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Dev endpoints are disabled in production.' })
    return
  }
  next()
})

// GET /api/dev/time — trả về giờ server hiện tại (có offset)
router.get('/time', (req: Request, res: Response) => {
  const now = getNow()
  res.json({
    server_time: now.toISOString(),
    offset_ms: getOffsetMs(),
    offset_hours: getOffsetMs() / 3600000,
    real_time: new Date().toISOString(),
  })
})

// POST /api/dev/time/offset — set offset (body: { offsetMs: number } hoặc { offsetHours: number })
router.post('/time/offset', (req: Request, res: Response) => {
  const { offsetMs, offsetHours } = req.body
  const ms = offsetMs !== undefined ? Number(offsetMs) : Number(offsetHours ?? 0) * 3600000
  if (isNaN(ms)) {
    res.status(400).json({ error: 'INVALID_OFFSET', message: 'offsetMs hoặc offsetHours phải là số.' })
    return
  }
  setOffsetMs(ms)
  res.json({
    message: `Offset đã được set thành ${ms / 3600000}h (${ms}ms)`,
    server_time: getNow().toISOString(),
    offset_ms: ms,
    offset_hours: ms / 3600000,
  })
})

// DELETE /api/dev/time/offset — reset về 0
router.delete('/time/offset', (req: Request, res: Response) => {
  resetOffset()
  res.json({ message: 'Offset đã reset về 0', server_time: getNow().toISOString(), offset_ms: 0 })
})
 
// POST /api/dev/trigger-schedule — kích hoạt xếp ca thủ công
router.post('/trigger-schedule', async (req: Request, res: Response) => {
  try {
    await runWeeklyScheduler()
    res.json({ message: 'Đã kích hoạt xếp ca tự động thành công.' })
  } catch (error: any) {
    res.status(500).json({ error: 'TRIGGER_FAILED', message: error.message })
  }
})

export { router as devRouter }
