import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'

const stats = [
  { label: 'Tổng người dùng', color: 'text-indigo-400' },
  { label: 'Tổng việc làm', color: 'text-emerald-600' },
  { label: 'Tổng ca làm', color: 'text-amber-600' },
  { label: 'Doanh thu hệ thống', color: 'text-rose-500' },
]

const AdminDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản trị hệ thống</h1>
          <p className="text-slate-300 mt-1 font-medium">Xem thống kê và quản lý người dùng toàn nền tảng</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={stat.label} glass delay={i * 0.1}>
              <p className={`text-xs font-black ${stat.color} uppercase tracking-widest mb-2`}>{stat.label}</p>
              <p className="text-4xl font-black text-slate-900">—</p>
              <p className="text-slate-600 text-sm mt-1 font-medium">Chưa có dữ liệu</p>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">Truy cập nhanh</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/users">
                <Button variant="secondary">Quản lý người dùng</Button>
              </Link>
              <Link to="/admin/jobs">
                <Button variant="secondary">Xem tất cả việc làm</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default AdminDashboard
