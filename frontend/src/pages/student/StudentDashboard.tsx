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

  useEffect(() => {
    apiClient.get('/shifts/my-stats')
      .then(res => setUpcomingShifts(res.data.upcoming_shifts))
      .catch(console.error)
  }, [])

  const reputationScore = user?.profile?.reputation_score ?? 100

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Xin chào, {user?.full_name}
          </h1>
          <p className="text-slate-300 mt-1 font-medium">Đây là tổng quan hoạt động của bạn</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glass delay={0.1}>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Ca sắp tới</p>
            <p className="text-4xl font-black text-slate-900">
              {upcomingShifts != null ? upcomingShifts : '—'}
            </p>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              {upcomingShifts != null ? 'Ca đã đăng ký' : 'Đang tải...'}
            </p>
          </Card>

          <Card glass delay={0.2}>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Thu nhập tháng này</p>
            <p className="text-4xl font-black text-slate-900">—</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">Chưa có dữ liệu</p>
          </Card>

          <Card glass delay={0.3}>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Điểm uy tín</p>
            <p className="text-4xl font-black text-slate-900">{Number(reputationScore).toFixed(1)}</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              {reputationScore >= 150 ? 'Ưu tiên cao' : reputationScore >= 100 ? 'Bình thường' : 'Ưu tiên thấp'}
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentDashboard
