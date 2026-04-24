import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'
import { markAllRead } from '../../api/notifications'
import Button from '../ui/Button'
import { DevTimeOffset } from '../DevTimeOffset'

const isDev = import.meta.env.DEV

interface DashboardLayoutProps { children: React.ReactNode }

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-bold transition-colors px-1 pb-0.5 border-b-2 ${
    isActive ? 'text-white border-indigo-500' : 'text-slate-400 border-transparent hover:text-white'
  }`

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { notifications, unreadCount, markAllRead: storeMarkAllRead } = useNotificationStore()
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [showNotif, setShowNotif] = React.useState(false)

  useNotificationSocket()

  const handleMarkAllRead = async () => {
    await markAllRead()
    storeMarkAllRead()
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20">S</div>
              <span className="text-white font-black text-xl uppercase tracking-tighter hidden sm:block">Smart Workforce</span>
            </div>

            <div className="flex items-center gap-6">
              {user?.role === 'employer' && (
                <>
                  <NavLink to="/employer" end className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/employer/jobs" className={navLinkClass}>Việc làm</NavLink>
                  <NavLink to="/employer/shifts" className={navLinkClass}>Ca làm</NavLink>
                  <NavLink to="/employer/employees" className={navLinkClass}>Nhân viên</NavLink>
                  <NavLink to="/employer/attendance" className={navLinkClass}>Điểm danh</NavLink>
                  <NavLink to="/employer/payroll" className={navLinkClass}>Lương</NavLink>
                  <NavLink to="/employer/reports" className={navLinkClass}>Báo cáo</NavLink>
                </>
              )}
              {user?.role === 'student' && (
                <>
                  <NavLink to="/student" end className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/student/shifts" className={navLinkClass}>Tìm ca</NavLink>
                  <NavLink to="/student/attendance" className={navLinkClass}>Điểm danh</NavLink>
                  <NavLink to="/student/payroll" className={navLinkClass}>Lương</NavLink>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin" end className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/admin/users" className={navLinkClass}>Người dùng</NavLink>
                  <NavLink to="/admin/jobs" className={navLinkClass}>Việc làm</NavLink>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-white/5">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-black text-white">Thông báo</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Đọc tất cả</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Không có thông báo</p>
                      ) : notifications.slice(0, 8).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${!n.is_read ? 'bg-indigo-500/5' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />}
                            <div className={!n.is_read ? '' : 'pl-3.5'}>
                              <p className="text-sm font-bold text-white">{n.title}</p>
                              {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
                              <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {user?.role !== 'admin' && (
                      <NavLink
                        to={`/${user?.role}/notifications`}
                        onClick={() => setShowNotif(false)}
                        className="block text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 py-3 border-t border-slate-800"
                      >
                        Xem tất cả
                      </NavLink>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700 group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-all overflow-hidden shadow-inner">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-white/5">
                    <div className="px-5 py-4 bg-slate-800/30 border-b border-slate-800">
                      <p className="text-sm font-black text-white truncate">{user?.full_name}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                        {user?.role === 'employer' ? 'Nhà tuyển dụng' : user?.role === 'student' ? 'Sinh viên' : 'Quản trị viên'}
                      </p>
                    </div>
                    <div className="p-2">
                      <NavLink
                        to={user?.role === 'employer' ? '/employer/profile' : user?.role === 'student' ? '/student/profile' : '/admin/profile'}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Hồ sơ cá nhân
                      </NavLink>
                      <button
                        onClick={() => { setShowDropdown(false); logout() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {isDev && <DevTimeOffset />}
    </div>
  )
}

export default DashboardLayout
