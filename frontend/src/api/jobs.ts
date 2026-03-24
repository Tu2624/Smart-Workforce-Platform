import apiClient from './client'
import type { Job } from '@/types'

export const jobsApi = {
  list: (params?: Record<string, string>) => apiClient.get<{ jobs: Job[] }>('/jobs', { params }),
  getOne: (id: string) => apiClient.get<{ job: Job }>(`/jobs/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post<{ job: Job }>('/jobs', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<{ job: Job }>(`/jobs/${id}`, data),
  remove: (id: string) => apiClient.delete(`/jobs/${id}`),
  patchStatus: (id: string, status: string) => apiClient.patch(`/jobs/${id}/status`, { status }),
}
