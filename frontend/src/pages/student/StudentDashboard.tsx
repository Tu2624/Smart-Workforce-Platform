import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'
import { Table, TableRow, TableCell } from '../../components/ui/Table'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] border border-dashed border-white/[0.05] rounded-2xl p-6">
    <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="text-xs font-medium tracking-wide uppercase">{message}</p>
  </div>
)

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const [upcomingShifts, setUpcomingShifts] = useState<number | null>(null)
  const [monthlyEarnings, setMonthlyEarnings] = useState<number | null>(null)
  const [chartData, setChartData] = useState<{
    earningsTrend: { month: string; earnings: number }[]
    statusBreakdown: { name: string; value: number }[]
  } | null>(null)
  const [recentShifts, setRecentShifts] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/shifts/my-stats')
      .then(res => {
        setUpcomingShifts(res.data.upcoming_shifts)
        setMonthlyEarnings(res.data.monthly_earnings)
      })
      .catch(console.error)

    apiClient.get('/shifts/chart-data')
      .then(res => setChartData(res.data))
      .catch(console.error)

    apiClient.get('/shifts', { params: { limit: 5 } })
      .then(res => setRecentShifts(res.data.shifts))
      .catch(console.error)
  }, [])

  const reputationScore = Number(user?.profile?.reputation_score ?? 100)
  const reputationPct = Math.min(100, (reputationScore / 200) * 100)
  const reputationLabel = reputationScore >= 150 ? 'Ưu tiên cao' : reputationScore >= 100 ? 'Bình thường' : 'Ưu tiên thấp'
  const reputationColor = reputationScore >= 150 ? 'from-amber-500 to-yellow-400' : reputationScore >= 100 ? 'from-cyan-500 to-blue-500' : 'from-red-500 to-orange-500'
  const reputationTextColor = reputationScore >= 150 ? 'text-amber-400' : reputationScore >= 100 ? 'text-cyan-400' : 'text-red-400'

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-4xl mx-auto">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none mb-2">
              Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user?.full_name?.split(' ').slice(-1)[0]}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              Tổng quan hoạt động cá nhân của bạn
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Thời gian hệ thống</p>
            <p className="text-sm font-mono text-slate-300">{new Date().toLocaleDateString('vi-VN')} • {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Upcoming Shifts Card */}
          <Card className="p-6 relative overflow-hidden group" delay={0.05}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl -mr-8 -mt-8 group-hover:bg-cyan-500/20 transition-colors" />
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ca sắp tới</p>
                <p className="text-3xl font-display font-black text-slate-100">
                  {upcomingShifts != null ? upcomingShifts : '—'}
                </p>
                <p className="text-slate-400 text-xs mt-1 font-medium italic">
                  {upcomingShifts != null ? (upcomingShifts > 0 ? 'Sẵn sàng làm việc' : 'Chưa có lịch đăng ký') : 'Đang tải dữ liệu...'}
                </p>
              </div>
            </div>
          </Card>

          {/* Earnings Card */}
          <Card className="p-6 relative overflow-hidden group" delay={0.1}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Thu nhập tháng này</p>
                <p className="text-3xl font-display font-black text-slate-100 truncate">
                  {monthlyEarnings != null ? monthlyEarnings.toLocaleString('vi-VN') + 'đ' : '—'}
                </p>
                <p className="text-slate-400 text-xs mt-1 font-medium italic">
                  {monthlyEarnings != null ? 'Tổng thu nhập tạm tính' : 'Đang tính toán...'}
                </p>
              </div>
            </div>
          </Card>

          {/* Reputation Score Card */}
          <Card className="p-6 relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1" delay={0.15}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 blur-3xl -mr-8 -mt-8 group-hover:bg-violet-500/20 transition-colors" />
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.10] uppercase tracking-wider ${reputationTextColor}`}>
                  {reputationLabel}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Điểm uy tín</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-slate-100">{reputationScore.toFixed(0)}</span>
                  <span className="text-slate-500 text-sm font-medium">/ 200</span>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${reputationPct}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                      className={`h-full rounded-full bg-gradient-to-r ${reputationColor} shadow-[0_0_12px_rgba(6,182,212,0.3)]`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earnings Trend - Takes 2/3 columns */}
          <Card className="p-6 lg:col-span-2 flex flex-col h-full overflow-hidden relative" delay={0.2}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-display font-black text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Xu hướng thu nhập
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Thống kê 6 tháng gần nhất</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">VND</span>
              </div>
            </div>
            
            <div className="h-[240px] w-full mt-auto">
              {chartData?.earningsTrend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.earningsTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#475569" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val: any) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${val/1000}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      formatter={(val: any) => [Number(val).toLocaleString('vi-VN') + 'đ', 'Thu nhập']}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Chưa có dữ liệu thu nhập" />
              )}
            </div>
          </Card>

          {/* Status Breakdown - Takes 1/3 column */}
          <Card className="p-6 flex flex-col h-full overflow-hidden" delay={0.25}>
            <div className="mb-6">
              <h3 className="text-base font-display font-black text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                Trạng thái ca làm
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Phân tích tổng quan</p>
            </div>
            
            <div className="flex-1 min-h-[220px] w-full flex items-center justify-center">
              {chartData?.statusBreakdown?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.statusBreakdown}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={1200}
                    >
                      {chartData.statusBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(2,6,23,0.8)" strokeWidth={3} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#f1f5f9' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={30} 
                      iconType="circle" 
                      iconSize={8}
                      formatter={(value) => <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Chưa có dữ liệu ca làm việc" />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Shifts Table */}
        <motion.div variants={itemVariants}>
          <Card className="p-0 overflow-hidden" delay={0.3}>
            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-base font-display font-black text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  Lịch sử ca làm gần đây
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">5 hoạt động mới nhất</p>
              </div>
              <a href="/student/shifts" className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors">
                Xem tất cả →
              </a>
            </div>
            
            {recentShifts.length > 0 ? (
              <Table headers={['Ca làm việc', 'Thời gian', 'Trạng thái', 'Thu nhập']}>
                {recentShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{shift.title}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{shift.employer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">
                          {new Date(shift.start_time).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {new Date(shift.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        shift.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        shift.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {shift.status === 'completed' ? 'Hoàn thành' :
                         shift.status === 'cancelled' ? 'Đã hủy' : 'Sắp tới'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-slate-200">
                        {shift.status === 'completed' ? `+${(shift.hourly_rate * (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000).toLocaleString('vi-VN')}đ` : '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic opacity-50">Bạn chưa có lịch sử ca làm nào</p>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentDashboard
