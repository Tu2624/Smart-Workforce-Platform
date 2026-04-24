import { Server } from 'socket.io'
import http from 'http'
import jwt from 'jsonwebtoken'

let io: Server

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id
    if (userId) socket.join(`user_${userId}`)
    socket.on('join:shift', ({ shift_id }: { shift_id: string }) => socket.join(`shift_${shift_id}`))
  })

  return io
}

export function notifyUser(userId: string, event: string, data: any) {
  if (!io) return
  io.to(`user_${userId}`).emit(event, data)
}

export function notifyShiftRoom(shiftId: string, event: string, data: any) {
  if (!io) return
  io.to(`shift_${shiftId}`).emit(event, data)
}
