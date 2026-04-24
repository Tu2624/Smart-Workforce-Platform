import apiClient from './client'

export const getEmployees = (params?: Record<string, any>) =>
  apiClient.get('/employers/employees', { params }).then(r => r.data)

export const createEmployee = (data: {
  email: string
  full_name: string
  phone?: string
  student_id?: string
  university?: string
}) => apiClient.post('/employers/employees', data).then(r => r.data)
