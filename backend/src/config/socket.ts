import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { env } from './env'

let io: Server

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket: Socket) => {
    socket.on('join:room', ({ room }: { room: string }) => {
      socket.join(room)
    })

    socket.on('join:shift', ({ shift_id }: { shift_id: string }) => {
      socket.join(`shift_${shift_id}`)
    })

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function notifyUser(userId: string, event: string, data: unknown): void {
  getIO().to(`user_${userId}`).emit(event, data)
}

export function notifyShiftRoom(shiftId: string, event: string, data: unknown): void {
  getIO().to(`shift_${shiftId}`).emit(event, data)
}
