import apiClient from './client'
import type { Shift, ShiftRegistration } from '@/types'

export const shiftsApi = {
  list: (params?: Record<string, string>) => apiClient.get<{ shifts: Shift[] }>('/shifts', { params }),
  getOne: (id: string) => apiClient.get<{ shift: Shift }>(`/shifts/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post<{ shift: Shift }>('/shifts', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<{ shift: Shift }>(`/shifts/${id}`, data),
  remove: (id: string) => apiClient.delete(`/shifts/${id}`),
  register: (id: string) => apiClient.post<{ registration: ShiftRegistration }>(`/shifts/${id}/register`),
  cancelRegistration: (id: string) => apiClient.delete(`/shifts/${id}/register`),
  getRegistrations: (id: string) => apiClient.get<{ registrations: ShiftRegistration[] }>(`/shifts/${id}/registrations`),
  reviewRegistration: (shiftId: string, regId: string, status: 'approved' | 'rejected') =>
    apiClient.patch(`/shifts/${shiftId}/registrations/${regId}`, { status }),
}
