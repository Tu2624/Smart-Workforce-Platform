import apiClient from './client'
import type { Notification } from '@/types'

export const notificationsApi = {
  list: (params?: Record<string, string>) => apiClient.get<{ notifications: Notification[] }>('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
}
