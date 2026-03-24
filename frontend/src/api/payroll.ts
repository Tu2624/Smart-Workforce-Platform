import apiClient from './client'
import type { Payroll } from '@/types'

export const payrollApi = {
  list: (params?: Record<string, string>) => apiClient.get<{ payrolls: Payroll[] }>('/payroll', { params }),
  getDetail: (id: string) => apiClient.get(`/payroll/${id}`),
  calculate: (period_start: string, period_end: string) => apiClient.post('/payroll/calculate', { period_start, period_end }),
  confirm: (id: string) => apiClient.patch(`/payroll/${id}/confirm`),
  markPaid: (id: string) => apiClient.patch(`/payroll/${id}/paid`),
  export: (id: string, format: 'pdf' | 'excel') => apiClient.get(`/payroll/${id}/export`, { params: { format }, responseType: 'blob' }),
}
