import { Server } from 'socket.io'
import http from 'http'

let io: Server

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
  })

  io.on('connection', (socket) => {
    socket.on('join:room', ({ room }: { room: string }) => socket.join(room))
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
