import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'
import { getRoles } from '../../api/employers'
import { Table, TableRow, TableCell } from '../../components/ui/Table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899']

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] border border-dashed border-white/[0.05] rounded-2xl p-6">
    <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="text-xs font-medium tracking-wide uppercase">{message}</p>
  </div>
)

interface CreateEmployeeForm {
  email: string; full_name: string; phone: string; student_id: string; university: string; role_id: string
}
interface CreatedEmployee {
  user: { id: string; email: string; role: string }; temp_password: string
}

const StatCard = ({ icon, label, value, gradient, delay, trend }: { icon: React.ReactNode; label: string; value: string; gradient: string; delay: number; trend?: string }) => (
  <Card className="p-6 relative overflow-hidden group" delay={delay}>
    <div className="absolute top-0 right-0 w-20 h-20 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity rounded-full -mr-6 -mt-6" style={{ background: 'white' }} />
    <div className="flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-display font-black text-slate-100 truncate leading-none">{value}</p>
          {trend && <span className="text-[10px] font-bold text-emerald-400 mb-1 leading-none">{trend}</span>}
        </div>
      </div>
    </div>
  </Card>
)

const EmployerDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedEmployee | null>(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<{ employees: number; today_shifts: number; current_month_payroll: number } | null>(null)
  const [chartData, setChartData] = useState<{
    weeklyShifts: { date: string; shifts: number }[]
    payrollByRole: { name: string; value: number }[]
  } | null>(null)
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState<CreateEmployeeForm>({ email: '', full_name: '', phone: '', student_id: '', university: '', role_id: '' })

  React.useEffect(() => {
    apiClient.get('/employers/stats').then(res => setStats(res.data)).catch(console.error)
    apiClient.get('/employers/chart-data').then(res => setChartData(res.data)).catch(console.error)
    apiClient.get('/employers/employees', { params: { limit: 5 } }).then(res => setEmployees(res.data.employees)).catch(console.error)
    getRoles().then(d => setRoles(d.roles || [])).catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.id]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setCreated(null)
    try {
      const body: Record<string, string> = { email: form.email, full_name: form.full_name }
      if (form.phone) body.phone = form.phone
      if (form.student_id) body.student_id = form.student_id
      if (form.university) body.university = form.university
      if (form.role_id) body.role_id = form.role_id
      const response = await apiClient.post('/employers/employees', body)
      setCreated(response.data)
      setForm({ email: '', full_name: '', phone: '', student_id: '', university: '', role_id: '' })
      if (stats) setStats({ ...stats, employees: stats.employees + 1 })
    } catch (err: any) {
      const data = err.response?.data
      if (data?.error === 'EMAIL_ALREADY_EXISTS') setError('Email này đã tồn tại trong hệ thống.')
      else if (data?.details?.length) setError(data.details.map((d: any) => d.message).join(' | '))
      else setError(data?.message || 'Tạo tài khoản thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (created?.temp_password) {
      navigator.clipboard.writeText(created.temp_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false); setCreated(null); setError('')
    setForm({ email: '', full_name: '', phone: '', student_id: '', university: '', role_id: '' })
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-6xl mx-auto">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none mb-2">
              Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{user?.full_name?.split(' ').slice(-1)[0]}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Chào mừng bạn trở lại trung tâm quản lý nhân sự
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => { setShowForm(true); setCreated(null); setError('') }}
            className="shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all group py-3 px-6"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tạo tài khoản nhân viên
            </span>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            delay={0.05}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
            label="Ca hôm nay"
            value={stats != null ? String(stats.today_shifts) : '—'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            }
          />
          <StatCard
            delay={0.1}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            label="Chi phí tháng"
            value={stats != null ? stats.current_month_payroll.toLocaleString('vi-VN') + 'đ' : '—'}
            trend="+12%"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            delay={0.15}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            label="Nhân viên"
            value={stats != null ? String(stats.employees) : '—'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
        </motion.div>

        {/* Create employee form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
              className="overflow-hidden"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-display font-semibold text-slate-100">Tạo tài khoản nhân viên</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Mật khẩu tạm thời sẽ hiển thị sau khi tạo</p>
                  </div>
                  <button onClick={handleCloseForm} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/[0.06]" aria-label="Đóng">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {created && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-emerald-400 font-semibold text-sm mb-1">Tạo tài khoản thành công!</p>
                        <p className="text-emerald-300/70 text-sm mb-3">Email: <span className="font-semibold">{created.user.email}</span></p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-900/80 border border-white/[0.10] rounded-xl px-4 py-2.5 font-mono text-lg font-bold text-slate-100 tracking-widest">
                            {created.temp_password}
                          </div>
                          <Button variant="secondary" size="sm" onClick={handleCopy}>
                            {copied ? 'Đã sao chép!' : 'Sao chép'}
                          </Button>
                        </div>
                        <p className="text-xs text-emerald-400/60 mt-2">Cung cấp mật khẩu này cho nhân viên ngay. Chỉ hiển thị một lần.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Input id="email" label="Email Công việc *" type="email" placeholder="nhanvien@example.com" required value={form.email} onChange={handleChange} />
                    <Input id="full_name" label="Họ và tên đầy đủ *" type="text" placeholder="Nguyễn Văn A" required value={form.full_name} onChange={handleChange} />
                    <Input id="phone" label="Số điện thoại" type="text" placeholder="0901234567" value={form.phone} onChange={handleChange} />
                    <Input id="student_id" label="Mã số sinh viên" type="text" placeholder="B22DCPT244" value={form.student_id} onChange={handleChange} />
                    <Input id="university" label="Trường đại học" type="text" placeholder="PTIT" value={form.university} onChange={handleChange} />
                    <div className="flex flex-col">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Vị trí / Chức danh</label>
                      {roles.length === 0 ? (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-[12px] h-[46px]">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <a href="/employer/roles" className="underline underline-offset-2 hover:text-amber-300">Tạo vị trí ngay</a>
                        </div>
                      ) : (
                        <select
                          value={form.role_id}
                          onChange={e => setForm({ ...form, role_id: e.target.value })}
                          className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all h-[46px]"
                        >
                          <option value="">-- Chọn vị trí --</option>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.05]">
                    <Button type="button" variant="ghost" onClick={handleCloseForm} className="px-6">Hủy bỏ</Button>
                    <Button type="submit" variant="primary" isLoading={loading} className="px-8 shadow-lg shadow-blue-500/20">Tạo ngay</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Shifts */}
          <Card className="p-8 flex flex-col" delay={0.2}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-display font-black text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  Ca làm việc hàng tuần
                </h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Thống kê 7 ngày vừa qua</p>
              </div>
              <div className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-auto">
              {chartData?.weeklyShifts?.some(d => d.shifts > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.weeklyShifts} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', fontSize: '12px', color: '#f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    <Bar 
                      dataKey="shifts" 
                      fill="url(#barGradient)" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                      animationDuration={1500}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Chưa có dữ liệu ca làm việc" />
              )}
            </div>
          </Card>

          {/* Payroll by Role */}
          <Card className="p-8 flex flex-col" delay={0.25}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-display font-black text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  Chi phí theo vị trí
                </h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Tháng hiện tại</p>
              </div>
              <div className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-auto">
              {chartData?.payrollByRole?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={chartData.payrollByRole} 
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      fontWeight="600"
                      tickLine={false} 
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', fontSize: '12px', color: '#f1f5f9' }}
                      formatter={(val: any) => [Number(val).toLocaleString('vi-VN') + 'đ', 'Chi phí']}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                      {chartData.payrollByRole.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Chưa có dữ liệu chi phí lương" />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Employees Table */}
        <motion.div variants={itemVariants}>
          <Card className="p-0 overflow-hidden" delay={0.3}>
            <div className="p-8 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  Đội ngũ nhân viên
                </h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Danh sách nhân sự mới nhất</p>
              </div>
              <a href="/employer/employees" className="text-[11px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.06]">
                Quản lý tất cả
              </a>
            </div>

            {employees.length > 0 ? (
              <Table headers={['Nhân viên', 'Vị trí', 'Liên hệ', 'Trạng thái']}>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.05] flex items-center justify-center text-slate-400 font-black text-xs">
                          {emp.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 leading-tight">{emp.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-bold tracking-tight">{emp.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-400 font-bold text-xs bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        {emp.role_name || 'Nhân viên'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-300 text-xs font-medium">{emp.phone || '—'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{emp.university || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Đang làm việc</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/[0.10]">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic opacity-50">Chưa có nhân viên nào trong danh sách</p>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default EmployerDashboard
