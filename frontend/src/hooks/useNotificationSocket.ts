import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore'
import { useNotificationStore } from '../store/useNotificationStore'
import type { Notification } from '../types'

let socket: Socket | null = null

export function useNotificationSocket() {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  const { addNotification, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    if (!user || !token) return

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
    socket = io(SOCKET_URL, { auth: { token } })

    socket.on('connect', () => {
      socket?.emit('join:room', { room: `user_${user.id}` })
      fetchNotifications()
    })

    socket.on('notification:new', (data: Notification) => {
      addNotification(data)
    })

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [user?.id, token])
}
