import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getReportOverview, getPayrollSummary, getPerformance, getShiftStats } from '../../api/reports'

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-')
  return `T${mo}/${y}`
}

const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <motion.div variants={itemVariants}>
    <Card className="p-4">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </Card>
  </motion.div>
)

const reputationColor = (score: number) => {
  if (score >= 150) return 'text-emerald-400'
  if (score >= 100) return 'text-blue-400'
  if (score >= 50)  return 'text-yellow-400'
  return 'text-rose-400'
}

const reputationLabel = (score: number) => {
  if (score >= 150) return 'Cao'
  if (score >= 100) return 'Bình thường'
  if (score >= 50)  return 'Thấp'
  return 'Rất thấp'
}

const ReportsPage: React.FC = () => {
  const [overview, setOverview]   = useState<any>(null)
  const [payroll, setPayroll]     = useState<any[]>([])
  const [perf, setPerf]           = useState<any[]>([])
  const [shifts, setShifts]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getReportOverview(),
      getPayrollSummary(),
      getPerformance(),
      getShiftStats(),
    ]).then(([ov, ps, pf, ss]) => {
      setOverview(ov)
      setPayroll(ps.months || [])
      setPerf(pf.employees || [])
      setShifts(ss.stats || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-12">

        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white">Báo cáo &amp; Phân tích</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tổng hợp dữ liệu hoạt động trong tháng hiện tại</p>
        </motion.div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Tổng ca làm" value={String(overview?.total_shifts ?? 0)} color="text-white" />
          <StatCard label="Giờ làm việc" value={`${(overview?.total_hours ?? 0).toFixed(1)}h`} color="text-indigo-400" />
          <StatCard label="Chi phí tháng này" value={fmt(overview?.total_cost ?? 0)} color="text-emerald-400" />
          <StatCard label="Tỷ lệ lấp đầy" value={`${overview?.fill_rate ?? 0}%`} color="text-blue-400" />
          <StatCard label="Nhân viên" value={String(overview?.total_employees ?? 0)} color="text-violet-400" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Payroll trend */}
          <motion.div variants={itemVariants}>
            <Card className="p-5">
              <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Chi phí lương 6 tháng gần nhất</h2>
              {payroll.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={payroll} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(v: any) => [fmt(Number(v)), 'Chi phí']}
                      labelFormatter={(m: any) => fmtMonth(String(m))}
                      contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12 }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Bar dataKey="total_amount" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Chi phí" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Shift stats */}
          <motion.div variants={itemVariants}>
            <Card className="p-5">
              <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Ca làm 30 ngày qua</h2>
              {shifts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={shifts} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} width={28} />
                    <Tooltip
                      labelFormatter={d => new Date(d).toLocaleDateString('vi-VN')}
                      contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12 }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    <Bar dataKey="completed" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Hoàn thành" stackId="a" />
                    <Bar dataKey="upcoming"  fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Sắp tới"    stackId="a" />
                    <Bar dataKey="cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} name="Đã hủy"     stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Employee performance table */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Hiệu suất nhân viên</h2>
            {perf.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">Chưa có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      {['Nhân viên', 'Tổng ca', 'Đúng giờ', 'Trễ', 'Vắng', 'Giờ làm', 'Đúng giờ %', 'Uy tín'].map(h => (
                        <th key={h} className="text-left pb-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {perf.map((e) => (
                      <tr key={e.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-200 whitespace-nowrap">{e.full_name}</td>
                        <td className="py-3.5 px-3 text-slate-400">{e.total_shifts}</td>
                        <td className="py-3.5 px-3 text-emerald-400">{e.on_time_count}</td>
                        <td className="py-3.5 px-3 text-amber-400">{e.late_count}</td>
                        <td className="py-3.5 px-3 text-rose-400">{e.absent_count}</td>
                        <td className="py-3.5 px-3 text-slate-400">{e.total_hours.toFixed(1)}h</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5 min-w-[4rem]">
                              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full" style={{ width: `${e.on_time_rate}%` }} />
                            </div>
                            <span className="text-slate-400 text-xs whitespace-nowrap">{e.on_time_rate}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`font-bold ${reputationColor(e.reputation_score)}`}>
                            {e.reputation_score}
                          </span>
                          <span className={`ml-1 text-xs ${reputationColor(e.reputation_score)}`}>
                            ({reputationLabel(e.reputation_score)})
                          </span>
                        </td>
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

export default ReportsPage
