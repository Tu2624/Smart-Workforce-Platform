import apiClient from './client'

export const getReportOverview = () =>
  apiClient.get('/reports/overview').then(r => r.data)

export const getPayrollSummary = () =>
  apiClient.get('/reports/payroll-summary').then(r => r.data)

export const getPerformance = () =>
  apiClient.get('/reports/performance').then(r => r.data)

export const getShiftStats = () =>
  apiClient.get('/reports/shifts').then(r => r.data)
