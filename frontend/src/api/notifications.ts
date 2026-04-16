import apiClient from './client'

export const getNotifications = (params?: Record<string, any>) =>
  apiClient.get('/notifications', { params }).then(r => r.data)

export const markRead = (id: string) =>
  apiClient.patch(`/notifications/${id}/read`).then(r => r.data)

export const markAllRead = () =>
  apiClient.patch('/notifications/read-all').then(r => r.data)
