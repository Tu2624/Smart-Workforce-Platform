import { create } from 'zustand'
import { getNotifications, markRead as apiMarkRead, markAllRead as apiMarkAllRead } from '../api/notifications'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  shiftRefreshTick: number
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Notification) => void
  bumpShiftRefresh: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  shiftRefreshTick: 0,

  fetchNotifications: async () => {
    try {
      const data = await getNotifications({ limit: 20 })
      set({ notifications: data.notifications, unreadCount: data.unread_count })
    } catch {}
  },

  markRead: async (id) => {
    await apiMarkRead(id)
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: async () => {
    await apiMarkAllRead()
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  addNotification: (n) => {
    set(s => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }))
  },

  bumpShiftRefresh: () => set(s => ({ shiftRefreshTick: s.shiftRefreshTick + 1 })),
}))
