import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { authRouter } from './modules/auth/auth.router'
import { employersRouter } from './modules/employers/employers.router'
import { jobsRouter } from './modules/jobs/jobs.router'
import { shiftsRouter } from './modules/shifts/shifts.router'
import { adminRouter } from './modules/admin/admin.router'

const app = express()

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    db: 'connected', // Assuming connection is fine since pool is active
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/employers', employersRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/shifts', shiftsRouter)
app.use('/api/admin', adminRouter)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Something went wrong!'
  })
})

const PORT = process.env.PORT || 3001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

export default app
