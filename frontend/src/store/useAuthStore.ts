import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../api/client'

interface User {
  id: string
  email: string
  role: 'student' | 'employer' | 'admin'
  full_name: string
  phone?: string
  avatar_url?: string
  profile?: any // More specific types can be added later as needed
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  registerEmployer: (data: any) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password })
        const { user, token } = response.data
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      registerEmployer: async (data) => {
        const response = await apiClient.post('/auth/register', data)
        const { user, token } = response.data
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const response = await apiClient.get('/auth/me')
          set({ user: response.data, isAuthenticated: true })
        } catch (error) {
          get().logout()
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
