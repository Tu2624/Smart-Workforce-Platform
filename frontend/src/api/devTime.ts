import apiClient from './client'

export const getServerTime = () =>
  apiClient.get('/dev/time').then(r => r.data)

export const setTimeOffset = (offsetHours: number) =>
  apiClient.post('/dev/time/offset', { offsetHours }).then(r => r.data)

export const resetTimeOffset = () =>
  apiClient.delete('/dev/time/offset').then(r => r.data)
