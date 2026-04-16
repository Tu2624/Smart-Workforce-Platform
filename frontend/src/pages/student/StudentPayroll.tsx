import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getMyPayroll } from '../../api/payroll'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-emerald-100 text-emerald-700',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán',
}

const StudentPayroll: React.FC = () => {
  const [payroll, setPayroll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyPayroll().then(d => setPayroll(d.payroll || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalEarned = payroll.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_amount, 0)

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Lương của tôi</h1>
          <p className="text-slate-400 mt-1">Theo dõi thu nhập theo từng tháng</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Tổng đã nhận</p>
            <p className="text-3xl font-black text-slate-900">{totalEarned.toLocaleString('vi-VN')}đ</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">Lịch sử bảng lương</h2>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Đang tải...</p>
            ) : payroll.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Chưa có dữ liệu lương.</p>
            ) : (
              <div className="space-y-3">
                {payroll.map(p => (
                  <Link key={p.id} to={`/student/payroll/${p.id}`}
                    className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-xl px-2 -mx-2 transition-colors">
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        Tháng {p.period_start?.slice(5, 7)}/{p.period_start?.slice(0, 4)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.company_name || p.employer_name} · {Number(p.total_hours).toFixed(1)}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{Number(p.total_amount).toLocaleString('vi-VN')}đ</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentPayroll
