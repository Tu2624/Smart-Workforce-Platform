import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import Button from '../ui/Button'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-bold transition-colors px-1 pb-0.5 border-b-2 ${
    isActive
      ? 'text-white border-indigo-500'
      : 'text-slate-400 border-transparent hover:text-white'
  }`

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [showDropdown, setShowDropdown] = React.useState(false)

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 flex-1">
            {/* Brand */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20">
                S
              </div>
              <span className="text-white font-black text-xl uppercase tracking-tighter hidden sm:block">
                Smart Workforce
              </span>
            </div>

            {/* Role-based nav links */}
            <div className="flex items-center gap-6">
              {user?.role === 'employer' && (
                <>
                  <NavLink to="/employer" end className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/employer/jobs" className={navLinkClass}>Việc làm</NavLink>
                  <NavLink to="/employer/shifts" className={navLinkClass}>Ca làm</NavLink>
                </>
              )}
              {user?.role === 'student' && (
                <>
                  <NavLink to="/student" end className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/student/shifts" className={navLinkClass}>Tìm ca làm</NavLink>
                </>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" end className={navLinkClass}>Dashboard</NavLink>
              )}
            </div>
          </div>

          {/* User Section with Dropdown */}
          <div className="relative shrink-0">
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
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-white/5">
                  <div className="px-5 py-4 bg-slate-800/30 border-b border-slate-800">
                    <p className="text-sm font-black text-white truncate">{user?.full_name}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{user?.role === 'employer' ? 'Nhà tuyển dụng' : user?.role === 'student' ? 'Sinh viên' : 'Quản trị viên'}</p>
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
                      onClick={() => { setShowDropdown(false); logout(); }}
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
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
