import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getMyPayroll } from '../../api/payroll'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  confirmed: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Lương của tôi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi thu nhập theo từng tháng</p>
        </motion.div>

        {/* Earnings banner */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl bg-gradient-to-r from-cyan-600/[0.18] via-blue-600/[0.14] to-purple-600/[0.10] border border-cyan-500/20 p-6">
            <p className="text-[11px] font-semibold text-cyan-500/70 uppercase tracking-widest mb-1">Tổng đã nhận</p>
            <p className="text-3xl font-display font-bold text-cyan-300 tabular-nums">{totalEarned.toLocaleString('vi-VN')}đ</p>
            <p className="text-slate-500 text-xs mt-1">Từ tất cả các kỳ lương đã thanh toán</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <h2 className="text-sm font-display font-semibold text-slate-200">Lịch sử bảng lương</h2>
            </div>
            {loading ? (
              <p className="text-slate-500 text-center py-8">Đang tải...</p>
            ) : payroll.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Chưa có dữ liệu lương.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Kỳ lương</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Công ty</th>
                    <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Số tiền</th>
                    <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payroll.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/student/payroll/${p.id}`} className="font-semibold text-slate-200 hover:text-cyan-400 transition-colors">
                          Tháng {p.period_start?.slice(5, 7)}/{p.period_start?.slice(0, 4)}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{Number(p.total_hours).toFixed(1)}h</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm hidden sm:table-cell">
                        {p.company_name || p.employer_name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-200 tabular-nums">
                        {Number(p.total_amount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentPayroll
