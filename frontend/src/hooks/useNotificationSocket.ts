import { useEffect } from 'react'
import { useSocket } from './useSocket'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification } from '@/types'

export function useNotificationSocket(): void {
  const socket = useSocket()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!socket) return
    const handler = (data: Notification) => {
      addNotification(data)
    }
    socket.on('notification:new', handler)
    return () => { socket.off('notification:new', handler) }
  }, [socket, addNotification])
}
