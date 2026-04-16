import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { initSocket } from './config/socket'
import { authRouter } from './modules/auth/auth.router'
import { employersRouter } from './modules/employers/employers.router'
import { jobsRouter } from './modules/jobs/jobs.router'
import { shiftsRouter } from './modules/shifts/shifts.router'
import { adminRouter } from './modules/admin/admin.router'
import { attendanceRouter } from './modules/attendance/attendance.router'
import { payrollRouter } from './modules/payroll/payroll.router'
import { notificationRouter } from './modules/notification/notification.router'
import { startWeeklyScheduler } from './jobs/weeklyScheduler'
import { startAbsentDetector } from './jobs/autoDetectAbsent'

const app = express()
const server = http.createServer(app)

initSocket(server)

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
})

app.use('/api/auth',          authRouter)
app.use('/api/employers',     employersRouter)
app.use('/api/jobs',          jobsRouter)
app.use('/api/shifts',        shiftsRouter)
app.use('/api/admin',         adminRouter)
app.use('/api/attendance',    attendanceRouter)
app.use('/api/payroll',       payrollRouter)
app.use('/api/notifications', notificationRouter)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Something went wrong!',
  })
})

const PORT = process.env.PORT || 3001

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
    startWeeklyScheduler()
    startAbsentDetector()
  })
}

export default app
