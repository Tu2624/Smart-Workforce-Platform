import apiClient from './client'

export const createRating = (data: { shift_id: string; student_id: string; score: number; comment?: string }) =>
  apiClient.post('/ratings', data).then(r => r.data)

export const getStudentRatings = (studentId: string) =>
  apiClient.get(`/ratings/student/${studentId}`).then(r => r.data)
