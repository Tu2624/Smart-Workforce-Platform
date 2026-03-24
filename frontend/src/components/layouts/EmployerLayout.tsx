import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

const navItems = [
  { to: '/employer', label: 'Tổng quan', end: true },
  { to: '/employer/jobs', label: 'Công việc' },
  { to: '/employer/shifts', label: 'Ca làm' },
  { to: '/employer/attendance', label: 'Chấm công' },
  { to: '/employer/payroll', label: 'Bảng lương' },
  { to: '/employer/reports', label: 'Báo cáo' },
  { to: '/employer/notifications', label: 'Thông báo' },
]

export function EmployerLayout() {
  const { user, logout } = useAuthStore()
  useNotificationSocket()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <p className="font-bold text-blue-600">Smart Workforce</p>
          <p className="text-xs text-gray-500 mt-1">{user?.full_name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="m-3 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Đăng xuất</button>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  )
}
