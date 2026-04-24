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
import { ratingsRouter } from './modules/ratings/ratings.router'
import { reportsRouter } from './modules/reports/reports.router'
import { devRouter } from './modules/dev/dev.router'
import { startWeeklyScheduler } from './jobs/weeklyScheduler'
import { startAbsentDetector } from './jobs/autoDetectAbsent'
import { startLowRegAlert } from './jobs/lowRegistrationAlert'

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
app.use('/api/ratings',       ratingsRouter)
app.use('/api/reports',       reportsRouter)
app.use('/api/dev',           devRouter)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack)
  }

  const statusCode = err.statusCode || 500
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'Something went wrong!'

  res.status(statusCode).json({
    error: errorCode,
    message: message,
  })
})

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set. Set it in .env before starting the server.')
  process.exit(1)
}

const PORT = process.env.PORT || 3001

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
    startWeeklyScheduler()
    startAbsentDetector()
    startLowRegAlert()
  })
}

export default app
