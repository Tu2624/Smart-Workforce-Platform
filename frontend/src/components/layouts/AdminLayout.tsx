import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <p className="font-bold text-purple-600">Admin Panel</p>
          <p className="text-xs text-gray-500 mt-1">{user?.full_name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[{ to: '/admin', label: 'Dashboard', end: true }, { to: '/admin/users', label: 'Người dùng' }, { to: '/admin/jobs', label: 'Công việc' }].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
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
