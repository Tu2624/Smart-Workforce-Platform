import apiClient from './client'

export const getEmployees = (params?: Record<string, any>) =>
  apiClient.get('/employers/employees', { params }).then(r => r.data)

export const createEmployee = (data: {
  email: string
  full_name: string
  phone?: string
  student_id?: string
  university?: string
  role_id?: string
}) => apiClient.post('/employers/employees', data).then(r => r.data)

export const updateEmployee = (id: string, data: {
  full_name?: string
  phone?: string
  student_id?: string
  university?: string
  role_id?: string | null
}) => apiClient.put(`/employers/employees/${id}`, data).then(r => r.data)

export const deleteEmployee = (id: string) =>
  apiClient.delete(`/employers/employees/${id}`).then(r => r.data)

export const getRoles = () =>
  apiClient.get('/employers/roles').then(r => r.data)

export const createRole = (data: { name: string; description?: string }) =>
  apiClient.post('/employers/roles', data).then(r => r.data)

export const updateRole = (roleId: string, data: { name?: string; description?: string }) =>
  apiClient.put(`/employers/roles/${roleId}`, data).then(r => r.data)

export const deleteRole = (roleId: string) =>
  apiClient.delete(`/employers/roles/${roleId}`).then(r => r.data)
