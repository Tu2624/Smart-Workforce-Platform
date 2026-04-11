import apiClient from './client'

export interface CreateShiftData {
  job_id: string
  start_time: string
  end_time: string
  max_workers: number
  title?: string
  auto_assign?: boolean
}

export const getShifts = (params?: Record<string, any>) =>
  apiClient.get('/shifts', { params }).then(r => r.data)

export const getShift = (id: string) =>
  apiClient.get(`/shifts/${id}`).then(r => r.data)

export const createShift = (data: CreateShiftData) =>
  apiClient.post('/shifts', data).then(r => r.data)

export const updateShift = (id: string, data: Partial<Omit<CreateShiftData, 'job_id'>>) =>
  apiClient.put(`/shifts/${id}`, data).then(r => r.data)

export const deleteShift = (id: string) =>
  apiClient.delete(`/shifts/${id}`).then(r => r.data)

export const registerShift = (id: string) =>
  apiClient.post(`/shifts/${id}/register`).then(r => r.data)

export const cancelRegistration = (id: string) =>
  apiClient.delete(`/shifts/${id}/register`).then(r => r.data)
