import { create } from 'zustand'
import type { Notification } from '@/types'
import { notificationsApi } from '@/api/notifications'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  addNotification: (n: Notification) => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    const { data } = await notificationsApi.list()
    const unread = data.notifications.filter((n) => !n.is_read).length
    set({ notifications: data.notifications, unreadCount: unread })
  },
  addNotification: (n) => {
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }))
  },
  markRead: async (id) => {
    await notificationsApi.markRead(id)
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },
  markAllRead: async () => {
    await notificationsApi.markAllRead()
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },
}))
