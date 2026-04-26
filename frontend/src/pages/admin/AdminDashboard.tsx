import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

interface Stats {
  total_users: number
  total_jobs: number
  total_shifts: number
  total_payroll_paid: number
}

const statCards = (stats: Stats | null) => [
  {
    label: 'Tổng người dùng',
    value: stats?.total_users != null ? String(stats.total_users) : '—',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    label: 'Tổng việc làm',
    value: stats?.total_jobs != null ? String(stats.total_jobs) : '—',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    label: 'Tổng ca làm',
    value: stats?.total_shifts != null ? String(stats.total_shifts) : '—',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
      </svg>
    ),
  },
  {
    label: 'Tổng lương đã trả',
    value: stats?.total_payroll_paid != null ? stats.total_payroll_paid.toLocaleString('vi-VN') + 'đ' : '—',
    gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const quickLinks = [
  { to: '/admin/users', label: 'Quản lý người dùng', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { to: '/admin/jobs', label: 'Xem tất cả việc làm', icon: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z' },
]

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    apiClient.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
  }, [])

  const cards = statCards(stats)

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Quản trị hệ thống</h1>
          <p className="text-slate-500 text-sm mt-0.5">Xem thống kê và quản lý người dùng toàn nền tảng</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((stat, i) => (
            <Card key={stat.label} className="p-5" delay={i * 0.05}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${stat.gradient} flex items-center justify-center shrink-0`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-slate-100 truncate">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Truy cập nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            {quickLinks.map(link => (
              <Link key={link.to} to={link.to}>
                <div className="flex items-center gap-3 p-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] rounded-xl transition-all duration-150 group">
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 font-medium transition-colors">{link.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default AdminDashboard
