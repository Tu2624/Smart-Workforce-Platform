import apiClient from './client'

export const updateProfile = (data: { full_name?: string; phone?: string }) =>
  apiClient.put('/auth/me', data).then(r => r.data)

export const changePassword = (data: { current_password: string; new_password: string }) =>
  apiClient.put('/auth/change-password', data).then(r => r.data)
