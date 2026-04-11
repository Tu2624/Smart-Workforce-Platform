import apiClient from './client'

export interface CreateJobData {
  title: string
  hourly_rate: number
  max_workers: number
  description?: string
  required_skills?: string[]
}

export const getJobs = (params?: Record<string, any>) =>
  apiClient.get('/jobs', { params }).then(r => r.data)

export const getJob = (id: string) =>
  apiClient.get(`/jobs/${id}`).then(r => r.data)

export const createJob = (data: CreateJobData) =>
  apiClient.post('/jobs', data).then(r => r.data)

export const updateJob = (id: string, data: Partial<CreateJobData>) =>
  apiClient.put(`/jobs/${id}`, data).then(r => r.data)

export const updateJobStatus = (id: string, status: 'active' | 'paused' | 'closed') =>
  apiClient.patch(`/jobs/${id}/status`, { status }).then(r => r.data)

export const deleteJob = (id: string) =>
  apiClient.delete(`/jobs/${id}`).then(r => r.data)
