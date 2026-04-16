import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getEmployerPayroll, confirmPayroll, markPayrollPaid } from '../../api/payroll'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-emerald-100 text-emerald-700',
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
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý lương</h1>
          <p className="text-slate-400 mt-1">Xem và xác nhận bảng lương nhân viên</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Card glass>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Chờ xác nhận</p>
            <p className="text-2xl font-black text-slate-900">{totalDraft.toLocaleString('vi-VN')}đ</p>
          </Card>
          <Card glass>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Đã xác nhận</p>
            <p className="text-2xl font-black text-slate-900">{totalConfirmed.toLocaleString('vi-VN')}đ</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">Danh sách bảng lương</h2>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Đang tải...</p>
            ) : payroll.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Chưa có bảng lương nào.</p>
            ) : (
              <div className="space-y-3">
                {payroll.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0 flex-wrap">
                    <Link to={`/employer/payroll/${p.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <p className="font-black text-slate-900 text-sm">{p.student_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tháng {p.period_start?.slice(5, 7)}/{p.period_start?.slice(0, 4)} · {Number(p.total_hours).toFixed(1)}h
                      </p>
                    </Link>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-slate-900 text-sm">{Number(p.total_amount).toLocaleString('vi-VN')}đ</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                      {p.status === 'draft' && (
                        <Button variant="secondary" size="sm" isLoading={actionId === p.id} onClick={() => handleConfirm(p.id)}>Xác nhận</Button>
                      )}
                      {p.status === 'confirmed' && (
                        <Button variant="primary" size="sm" isLoading={actionId === p.id} onClick={() => handlePaid(p.id)}>Đã trả</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default PayrollList
