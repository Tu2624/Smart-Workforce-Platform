import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'
import { markAllRead } from '../../api/notifications'
import { DevTimeOffset } from '../DevTimeOffset'

const isDev = import.meta.env.DEV

interface DashboardLayoutProps { children: React.ReactNode }

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-white/[0.08] text-cyan-400'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
  }`

const Icon = ({ d, className = 'w-4 h-4' }: { d: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`${className} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const ICONS = {
  dashboard: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  jobs: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
  shifts: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
  employees: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  attendance: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  payroll: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  reports: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  browse: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  users: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { notifications, unreadCount, markAllRead: storeMarkAllRead } = useNotificationStore()
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [showNotif, setShowNotif] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  useNotificationSocket()

  const handleMarkAllRead = async () => {
    await markAllRead()
    storeMarkAllRead()
  }

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#020617]/95 backdrop-blur-xl border-r border-white/[0.06]
      transition-transform duration-200 ease-out
      lg:static lg:translate-x-0
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Brand */}
      <div className="h-14 px-4 flex items-center border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-glow-sm">S</div>
          <span className="font-bold text-white text-sm tracking-tight">Smart Workforce</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {user?.role === 'employer' && (
          <>
            <NavLink to="/employer" end className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.dashboard} /> Dashboard
            </NavLink>
            <NavLink to="/employer/jobs" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.jobs} /> Việc làm
            </NavLink>
            <NavLink to="/employer/shifts" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.shifts} /> Ca làm
            </NavLink>
            <NavLink to="/employer/employees" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.employees} /> Nhân viên
            </NavLink>
            <NavLink to="/employer/attendance" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.attendance} /> Điểm danh
            </NavLink>
            <NavLink to="/employer/payroll" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.payroll} /> Lương
            </NavLink>
            <NavLink to="/employer/reports" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.reports} /> Báo cáo
            </NavLink>
          </>
        )}
        {user?.role === 'student' && (
          <>
            <NavLink to="/student" end className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.dashboard} /> Dashboard
            </NavLink>
            <NavLink to="/student/shifts" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.browse} /> Tìm ca làm
            </NavLink>
            <NavLink to="/student/attendance" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.attendance} /> Điểm danh
            </NavLink>
            <NavLink to="/student/payroll" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.payroll} /> Lương
            </NavLink>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin" end className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.dashboard} /> Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.users} /> Người dùng
            </NavLink>
            <NavLink to="/admin/jobs" className={navCls} onClick={() => setSidebarOpen(false)}>
              <Icon d={ICONS.jobs} /> Việc làm
            </NavLink>
          </>
        )}
      </nav>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mx-2" />

      {/* User footer */}
      <div className="p-2 shrink-0">
        <div className="bg-white/[0.04] rounded-xl p-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/[0.10] flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : <Icon d={ICONS.user} className="w-3.5 h-3.5 text-slate-400" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.role === 'employer' ? 'Nhà tuyển dụng' : user?.role === 'student' ? 'Sinh viên' : 'Quản trị viên'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors"
          >
            <Icon d={ICONS.logout} className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-5 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors"
          >
            <Icon d={ICONS.menu} />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors"
              >
                <Icon d={ICONS.bell} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-100">Thông báo</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Đọc tất cả</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Không có thông báo</p>
                      ) : notifications.slice(0, 8).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors ${!n.is_read ? 'bg-cyan-500/[0.05]' : ''}`}>
                          <div className="flex items-start gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-transparent'}`} />
                            <div>
                              <p className="text-sm font-semibold text-slate-100">{n.title}</p>
                              {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
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
                        className="block text-center text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-3 border-t border-white/[0.06] transition-colors"
                      >
                        Xem tất cả
                      </NavLink>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User avatar button */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center overflow-hidden hover:border-cyan-500/40 hover:bg-white/[0.10] transition-all ml-1"
              >
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <Icon d={ICONS.user} className="w-4 h-4 text-slate-400" />
                }
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-slate-100 truncate">{user?.full_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user?.role === 'employer' ? 'Nhà tuyển dụng' : user?.role === 'student' ? 'Sinh viên' : 'Quản trị viên'}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <NavLink
                        to={user?.role === 'employer' ? '/employer/profile' : user?.role === 'student' ? '/student/profile' : '/admin/profile'}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-xl transition-colors"
                      >
                        <Icon d={ICONS.user} className="w-4 h-4" /> Hồ sơ cá nhân
                      </NavLink>
                      <button
                        onClick={() => { setShowDropdown(false); logout() }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                      >
                        <Icon d={ICONS.logout} className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7">
          {isDev && <DevTimeOffset />}
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
