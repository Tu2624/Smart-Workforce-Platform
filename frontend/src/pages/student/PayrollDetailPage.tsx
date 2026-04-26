import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getPayrollDetail, exportPayrollExcel } from '../../api/payroll'
import Button from '../../components/ui/Button'

const StudentPayrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [payroll, setPayroll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (id) getPayrollDetail(id).then(d => setPayroll(d.payroll)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <DashboardLayout><p className="text-slate-400 text-center py-20">Đang tải...</p></DashboardLayout>
  if (!payroll) return <DashboardLayout><p className="text-slate-400 text-center py-20">Không tìm thấy.</p></DashboardLayout>

  const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
    confirmed: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
    paid: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  }
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Nháp', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán',
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
        <motion.div variants={itemVariants}>
          <Link to="/student/payroll" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Lương của tôi</Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="rounded-2xl bg-gradient-to-r from-cyan-600/[0.18] via-blue-600/[0.14] to-purple-600/[0.10] border border-cyan-500/20 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-semibold text-cyan-500/70 uppercase tracking-widest mb-1">Kỳ lương</p>
                <h1 className="text-2xl font-display font-bold text-white">
                  Tháng {payroll.period_start?.slice(5, 7)}/{payroll.period_start?.slice(0, 4)}
                </h1>
                {payroll.company_name && <p className="text-slate-400 text-sm mt-1">{payroll.company_name}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[payroll.status]}`}>
                  {STATUS_LABELS[payroll.status]}
                </span>
                <Button variant="ghost" size="sm" isLoading={exporting} onClick={async () => {
                  setExporting(true)
                  try { await exportPayrollExcel(id!, `luong-${payroll.period_start?.slice(0,7)}.xlsx`) }
                  catch { alert('Xuất file thất bại.') }
                  finally { setExporting(false) }
                }}>↓ Excel</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/[0.10]">
              <div>
                <p className="text-[10px] text-cyan-500/60 font-semibold uppercase tracking-widest mb-1">Tổng giờ</p>
                <p className="text-2xl font-display font-bold text-white">{Number(payroll.total_hours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-[10px] text-cyan-500/60 font-semibold uppercase tracking-widest mb-1">Tổng lương</p>
                <p className="text-2xl font-display font-bold text-cyan-300">{Number(payroll.total_amount).toLocaleString('vi-VN')}đ</p>
              </div>
              <div>
                <p className="text-[10px] text-cyan-500/60 font-semibold uppercase tracking-widest mb-1">Công ty</p>
                <p className="text-sm font-semibold text-slate-300 mt-1">{payroll.company_name || '—'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <h2 className="text-sm font-display font-semibold text-slate-200">Chi tiết từng ca</h2>
            </div>
            {(!payroll.items || payroll.items.length === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">Chưa có ca nào được tính lương.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Ca làm</th>
                      <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Kế hoạch</th>
                      <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Thực tế</th>
                      <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Khấu trừ</th>
                      <th className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payroll.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-200">{item.shift_title || 'Ca làm việc'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.start_time ? new Date(item.start_time).toLocaleDateString('vi-VN') : ''}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell">{Number(item.scheduled_hours).toFixed(1)}h</td>
                        <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell">{Number(item.hours_worked).toFixed(1)}h</td>
                        <td className="px-5 py-3.5 text-red-400">
                          {item.deduction_minutes > 0 ? `-${Number(item.deduction_amount).toLocaleString('vi-VN')}đ` : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-100 tabular-nums">{Number(item.subtotal).toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentPayrollDetail
