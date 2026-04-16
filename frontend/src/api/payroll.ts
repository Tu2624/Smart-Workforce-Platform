import apiClient from './client'

export const getMyPayroll = (params?: Record<string, any>) =>
  apiClient.get('/payroll', { params }).then(r => r.data)

export const getEmployerPayroll = (params?: Record<string, any>) =>
  apiClient.get('/payroll/employer', { params }).then(r => r.data)

export const getPayrollDetail = (id: string) =>
  apiClient.get(`/payroll/${id}`).then(r => r.data)

export const confirmPayroll = (id: string) =>
  apiClient.patch(`/payroll/${id}/confirm`).then(r => r.data)

export const markPayrollPaid = (id: string) =>
  apiClient.patch(`/payroll/${id}/paid`).then(r => r.data)
