import apiClient from './client'
import type { Attendance } from '@/types'

export const attendanceApi = {
  checkIn: (shift_id: string) => apiClient.post<{ attendance: Attendance }>('/attendance/checkin', { shift_id }),
  checkOut: (shift_id: string) => apiClient.post<{ attendance: Attendance }>('/attendance/checkout', { shift_id }),
  getHistory: (params?: Record<string, string>) => apiClient.get<{ records: Attendance[] }>('/attendance', { params }),
  getShiftAttendance: (shiftId: string) => apiClient.get<{ records: Attendance[] }>(`/attendance/shift/${shiftId}`),
}
