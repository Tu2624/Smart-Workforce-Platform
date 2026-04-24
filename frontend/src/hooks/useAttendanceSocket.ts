import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore'

export function useAttendanceSocket(shiftId: string | null, onUpdate: () => void) {
  const token = useAuthStore(s => s.token)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!token || !shiftId) return

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
    const socket: Socket = io(SOCKET_URL, { auth: { token } })

    socket.on('connect', () => {
      socket.emit('join:shift', { shift_id: shiftId })
    })

    socket.on('attendance:update', () => {
      onUpdateRef.current()
    })

    return () => {
      socket.disconnect()
    }
  }, [token, shiftId])
}
