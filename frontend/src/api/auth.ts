import apiClient from './client'
import type { User } from '@/types'

export const authApi = {
  register: (data: Record<string, unknown>) => apiClient.post('/auth/register', data),
  login: (email: string, password: string) => apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
  getMe: () => apiClient.get<{ user: User }>('/auth/me'),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/auth/profile', data),
  changePassword: (current: string, next: string) => apiClient.put('/auth/change-password', { current_password: current, new_password: next }),
}
