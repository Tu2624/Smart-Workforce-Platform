import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getPayrollDetail, confirmPayroll, markPayrollPaid, exportPayrollExcel } from '../../api/payroll'

const EmployerPayrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [payroll, setPayroll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchDetail = () => {
    if (id) getPayrollDetail(id).then(d => setPayroll(d.payroll)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchDetail() }, [id])

  const handleAction = async (fn: (id: string) => Promise<any>) => {
    setActionLoading(true)
    try { await fn(id!); fetchDetail() }
    catch (err: any) { alert(err.response?.data?.message || 'Thất bại.') }
    finally { setActionLoading(false) }
  }

  if (loading) return <DashboardLayout><p className="text-slate-400 text-center py-20">Đang tải...</p></DashboardLayout>
  if (!payroll) return <DashboardLayout><p className="text-slate-400 text-center py-20">Không tìm thấy.</p></DashboardLayout>

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Link to="/employer/payroll" className="text-slate-400 hover:text-white text-sm transition-colors">← Quản lý lương</Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-display font-bold text-white">Bảng lương — {payroll.student_name}</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Tháng {payroll.period_start?.slice(5, 7)}/{payroll.period_start?.slice(0, 4)}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="ghost" size="sm" isLoading={exporting} onClick={async () => {
                  setExporting(true)
                  try { await exportPayrollExcel(id!, `luong-${payroll.student_name}-${payroll.period_start?.slice(0,7)}.xlsx`) }
                  catch { alert('Xuất file thất bại.') }
                  finally { setExporting(false) }
                }}>↓ Xuất Excel</Button>
                {payroll.status === 'draft' && (
                  <Button variant="secondary" isLoading={actionLoading} onClick={() => handleAction(confirmPayroll)}>Xác nhận</Button>
                )}
                {payroll.status === 'confirmed' && (
                  <Button variant="primary" isLoading={actionLoading} onClick={() => handleAction(markPayrollPaid)}>Đánh dấu đã trả</Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/[0.08]">
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Tổng giờ</p>
                <p className="text-2xl font-display font-bold text-slate-100">{Number(payroll.total_hours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Tổng lương</p>
                <p className="text-2xl font-display font-bold text-cyan-300">{Number(payroll.total_amount).toLocaleString('vi-VN')}đ</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Trạng thái</p>
                <p className="text-sm font-semibold text-slate-300 mt-1">{payroll.status === 'paid' ? 'Đã thanh toán' : payroll.status === 'confirmed' ? 'Đã xác nhận' : 'Nháp'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Chi tiết từng ca</h2>
            {(!payroll.items || payroll.items.length === 0) ? (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có ca nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Ca làm</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Kế hoạch</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Thực tế</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Lương/giờ</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Khấu trừ</th>
                      <th className="pb-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] transition-colors">
                        <td className="py-2.5 pr-4">
                          <p className="font-semibold text-slate-100">{item.shift_title || 'Ca làm việc'}</p>
                          <p className="text-xs text-slate-500">{item.start_time ? new Date(item.start_time).toLocaleDateString('vi-VN') : ''}</p>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-400">{Number(item.scheduled_hours).toFixed(1)}h</td>
                        <td className="py-2.5 pr-4 text-slate-400">{Number(item.hours_worked).toFixed(1)}h</td>
                        <td className="py-2.5 pr-4 text-slate-400">{Number(item.hourly_rate).toLocaleString('vi-VN')}đ</td>
                        <td className="py-2.5 pr-4 text-red-400">{item.deduction_minutes > 0 ? `-${Number(item.deduction_amount).toLocaleString('vi-VN')}đ` : '—'}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-100">{Number(item.subtotal).toLocaleString('vi-VN')}đ</td>
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

export default EmployerPayrollDetail
