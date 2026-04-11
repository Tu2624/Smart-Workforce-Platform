import React from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)

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
            <p className="text-4xl font-black text-slate-900">—</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">Chưa có dữ liệu</p>
          </Card>

          <Card glass delay={0.2}>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Thu nhập tháng này</p>
            <p className="text-4xl font-black text-slate-900">—</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">Chưa có dữ liệu</p>
          </Card>

          <Card glass delay={0.3}>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Điểm uy tín</p>
            <p className="text-4xl font-black text-slate-900">{user?.profile?.reputation_score || '100.00'}</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">Mức mặc định</p>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentDashboard
