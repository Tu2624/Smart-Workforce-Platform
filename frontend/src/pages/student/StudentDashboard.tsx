import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const [upcomingShifts, setUpcomingShifts] = useState<number | null>(null)
  const [monthlyEarnings, setMonthlyEarnings] = useState<number | null>(null)

  useEffect(() => {
    apiClient.get('/shifts/my-stats')
      .then(res => {
        setUpcomingShifts(res.data.upcoming_shifts)
        setMonthlyEarnings(res.data.monthly_earnings)
      })
      .catch(console.error)
  }, [])

  const reputationScore = Number(user?.profile?.reputation_score ?? 100)
  const reputationPct = Math.min(100, (reputationScore / 200) * 100)
  const reputationLabel = reputationScore >= 150 ? 'Ưu tiên cao' : reputationScore >= 100 ? 'Bình thường' : 'Ưu tiên thấp'
  const reputationColor = reputationScore >= 150 ? 'from-amber-500 to-yellow-400' : reputationScore >= 100 ? 'from-cyan-500 to-blue-500' : 'from-red-500 to-orange-500'
  const reputationTextColor = reputationScore >= 150 ? 'text-amber-400' : reputationScore >= 100 ? 'text-cyan-400' : 'text-red-400'

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-2xl">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">
            Xin chào, {user?.full_name?.split(' ').slice(-1)[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Tổng quan hoạt động của bạn</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5" delay={0.05}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Ca sắp tới</p>
                <p className="text-2xl font-display font-bold text-slate-100">
                  {upcomingShifts != null ? upcomingShifts : '—'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {upcomingShifts != null ? 'Ca đã đăng ký' : 'Đang tải...'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5" delay={0.1}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Thu nhập tháng này</p>
                <p className="text-2xl font-display font-bold text-slate-100 truncate">
                  {monthlyEarnings != null ? monthlyEarnings.toLocaleString('vi-VN') + 'đ' : '—'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {monthlyEarnings != null ? 'Tháng hiện tại' : 'Đang tải...'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Reputation card with progress bar */}
        <motion.div variants={itemVariants}>
          <Card className="p-5" delay={0.15}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Điểm uy tín</p>
                  <p className="text-2xl font-display font-bold text-slate-100">{reputationScore.toFixed(1)}<span className="text-slate-500 text-sm font-normal">/200</span></p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] ${reputationTextColor}`}>
                {reputationLabel}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${reputationPct}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0, 0, 1], delay: 0.3 }}
                className={`h-full rounded-full bg-gradient-to-r ${reputationColor}`}
              />
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentDashboard
