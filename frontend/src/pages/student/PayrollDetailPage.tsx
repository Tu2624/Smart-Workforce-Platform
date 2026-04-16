import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getPayrollDetail } from '../../api/payroll'

const StudentPayrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [payroll, setPayroll] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) getPayrollDetail(id).then(d => setPayroll(d.payroll)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <DashboardLayout><p className="text-slate-400 text-center py-20">Đang tải...</p></DashboardLayout>
  if (!payroll) return <DashboardLayout><p className="text-slate-400 text-center py-20">Không tìm thấy.</p></DashboardLayout>

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Link to="/student/payroll" className="text-slate-400 hover:text-white text-sm transition-colors">← Lương của tôi</Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h1 className="text-2xl font-black text-slate-900">
              Tháng {payroll.period_start?.slice(5, 7)}/{payroll.period_start?.slice(0, 4)}
            </h1>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tổng giờ</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{Number(payroll.total_hours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tổng lương</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{Number(payroll.total_amount).toLocaleString('vi-VN')}đ</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Trạng thái</p>
                <p className="text-sm font-black text-slate-700 mt-2">{payroll.status === 'paid' ? 'Đã thanh toán' : payroll.status === 'confirmed' ? 'Đã xác nhận' : 'Nháp'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">Chi tiết từng ca</h2>
            {(!payroll.items || payroll.items.length === 0) ? (
              <p className="text-slate-400 text-sm text-center py-6">Chưa có ca nào được tính lương.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 pr-4">Ca làm</th>
                      <th className="pb-2 pr-4">Giờ kế hoạch</th>
                      <th className="pb-2 pr-4">Giờ thực</th>
                      <th className="pb-2 pr-4">Khấu trừ</th>
                      <th className="pb-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 pr-4">
                          <p className="font-semibold text-slate-900">{item.shift_title || 'Ca làm việc'}</p>
                          <p className="text-xs text-slate-400">{item.start_time ? new Date(item.start_time).toLocaleDateString('vi-VN') : ''}</p>
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{Number(item.scheduled_hours).toFixed(1)}h</td>
                        <td className="py-2 pr-4 text-slate-600">{Number(item.hours_worked).toFixed(1)}h</td>
                        <td className="py-2 pr-4 text-red-500">
                          {item.deduction_minutes > 0 ? `-${Number(item.deduction_amount).toLocaleString('vi-VN')}đ` : '—'}
                        </td>
                        <td className="py-2 text-right font-black text-slate-900">{Number(item.subtotal).toLocaleString('vi-VN')}đ</td>
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
