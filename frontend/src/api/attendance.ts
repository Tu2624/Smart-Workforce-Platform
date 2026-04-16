import apiClient from './client'

export const checkIn = (shift_id: string) =>
  apiClient.post('/attendance/checkin', { shift_id }).then(r => r.data)

export const checkOut = (shift_id: string) =>
  apiClient.post('/attendance/checkout', { shift_id }).then(r => r.data)

export const getMyAttendance = (params?: Record<string, any>) =>
  apiClient.get('/attendance', { params }).then(r => r.data)

export const getShiftAttendance = (shiftId: string) =>
  apiClient.get(`/attendance/shift/${shiftId}`).then(r => r.data)

export const forceComplete = (attendanceId: string) =>
  apiClient.patch(`/attendance/${attendanceId}/force-complete`).then(r => r.data)

export const updateNote = (attendanceId: string, note: string) =>
  apiClient.patch(`/attendance/${attendanceId}`, { note }).then(r => r.data)
