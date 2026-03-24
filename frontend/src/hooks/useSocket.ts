import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

let socketInstance: Socket | null = null

export function useSocket(): Socket | null {
  const { user, token } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user || !token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? '', {
      auth: { token },
      transports: ['websocket'],
    })
    socket.emit('join:room', { room: `user_${user.id}` })
    socketRef.current = socket
    socketInstance = socket

    return () => {
      socket.disconnect()
      socketInstance = null
    }
  }, [user, token])

  return socketRef.current
}

export function getSocket(): Socket | null {
  return socketInstance
}
