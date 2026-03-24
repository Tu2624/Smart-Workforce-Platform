import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface RoleRouteProps { role: UserRole }

export function RoleRoute({ role }: RoleRouteProps) {
  const { user } = useAuthStore()
  if (!user || user.role !== role) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
