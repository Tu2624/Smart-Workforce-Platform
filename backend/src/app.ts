import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './config/env'
import { initSocket } from './config/socket'
import { errorHandler } from './middleware/errorHandler'

import authRouter from './modules/auth/auth.router'
import jobRouter from './modules/job/job.router'
import shiftRouter from './modules/shift/shift.router'
import attendanceRouter from './modules/attendance/attendance.router'
import payrollRouter from './modules/payroll/payroll.router'
import notificationRouter from './modules/notification/notification.router'
import reportRouter from './modules/report/report.router'
import adminRouter from './modules/admin/admin.router'

import { startAutoCalcPayroll } from './jobs/autoCalcPayroll'
import { startSendReminders } from './jobs/sendReminders'

const app = express()
const httpServer = http.createServer(app)

// Socket.io
initSocket(httpServer)

// Middleware
app.use(helmet())
app.use(cors({ origin: env.corsOrigin, credentials: true }))
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'))
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/jobs', jobRouter)
app.use('/api/shifts', shiftRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/payroll', payrollRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/reports', reportRouter)
app.use('/api/admin', adminRouter)

// Global error handler (must be last)
app.use(errorHandler)

// Start background jobs
startAutoCalcPayroll()
startSendReminders()

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port} [${env.nodeEnv}]`)
})

export default app
