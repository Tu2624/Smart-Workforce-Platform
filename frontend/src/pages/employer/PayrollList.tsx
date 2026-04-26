import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getEmployerPayroll, confirmPayroll, markPayrollPaid } from '../../api/payroll'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  confirmed: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán',
}

const PayrollList: React.FC = () => {
  const [payroll, setPayroll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchPayroll = () => {
    setLoading(true)
    getEmployerPayroll().then(d => setPayroll(d.payroll || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayroll() }, [])

  const handleConfirm = async (id: string) => {
    setActionId(id)
    try { await confirmPayroll(id); fetchPayroll() }
    catch (err: any) { alert(err.response?.data?.message || 'Thất bại.') }
    finally { setActionId(null) }
  }

  const handlePaid = async (id: string) => {
    setActionId(id)
    try { await markPayrollPaid(id); fetchPayroll() }
    catch (err: any) { alert(err.response?.data?.message || 'Thất bại.') }
    finally { setActionId(null) }
  }

  const totalDraft = payroll.filter(p => p.status === 'draft').reduce((s, p) => s + p.total_amount, 0)
  const totalConfirmed = payroll.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.total_amount, 0)

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Quản lý lương</h1>
          <p className="text-slate-500 text-sm mt-0.5">Xem và xác nhận bảng lương nhân viên</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Card className="p-5" delay={0.05}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Chờ xác nhận</p>
                <p className="text-xl font-display font-bold text-slate-100 truncate">{totalDraft.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          </Card>
          <Card className="p-5" delay={0.1}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Đã xác nhận</p>
                <p className="text-xl font-display font-bold text-slate-100 truncate">{totalConfirmed.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <h2 className="text-sm font-display font-semibold text-slate-200">Danh sách bảng lương</h2>
            </div>
            {loading ? (
              <p className="text-slate-500 text-center py-8">Đang tải...</p>
            ) : payroll.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Chưa có bảng lương nào.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nhân viên</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Kỳ lương</th>
                    <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Số tiền</th>
                    <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payroll.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/employer/payroll/${p.id}`} className="font-semibold text-slate-200 hover:text-cyan-400 transition-colors">
                          {p.student_name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{Number(p.total_hours).toFixed(1)}h</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs hidden sm:table-cell">
                        Tháng {p.period_start?.slice(5, 7)}/{p.period_start?.slice(0, 4)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-200 tabular-nums">
                        {Number(p.total_amount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {p.status === 'draft' && (
                          <Button variant="secondary" size="sm" isLoading={actionId === p.id} onClick={() => handleConfirm(p.id)}>Xác nhận</Button>
                        )}
                        {p.status === 'confirmed' && (
                          <Button variant="primary" size="sm" isLoading={actionId === p.id} onClick={() => handlePaid(p.id)}>Đã trả</Button>
                        )}
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

export default PayrollList
