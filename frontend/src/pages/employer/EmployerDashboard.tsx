import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuthStore } from '../../store/useAuthStore'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

interface CreateEmployeeForm {
  email: string; full_name: string; phone: string; student_id: string; university: string
}
interface CreatedEmployee {
  user: { id: string; email: string; role: string }; temp_password: string
}

const StatCard = ({ icon, label, value, gradient, delay }: { icon: React.ReactNode; label: string; value: string; gradient: string; delay: number }) => (
  <Card className="p-5" delay={delay}>
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-display font-bold text-slate-100 truncate">{value}</p>
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
  const [form, setForm] = useState<CreateEmployeeForm>({ email: '', full_name: '', phone: '', student_id: '', university: '' })

  React.useEffect(() => {
    apiClient.get('/employers/stats').then(res => setStats(res.data)).catch(console.error)
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
      const response = await apiClient.post('/employers/employees', body)
      setCreated(response.data)
      setForm({ email: '', full_name: '', phone: '', student_id: '', university: '' })
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
    setForm({ email: '', full_name: '', phone: '', student_id: '', university: '' })
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              Xin chào, {user?.full_name?.split(' ').slice(-1)[0]}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Tổng quan hoạt động của bạn</p>
          </div>
          <Button variant="primary" onClick={() => { setShowForm(true); setCreated(null); setError('') }}>
            + Tạo nhân viên
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            delay={0.05}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
            label="Ca hôm nay"
            value={stats != null ? String(stats.today_shifts) : '—'}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            }
          />
          <StatCard
            delay={0.1}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            label="Chi phí tháng này"
            value={stats != null ? stats.current_month_payroll.toLocaleString('vi-VN') + 'đ' : '—'}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input id="email" label="Email *" type="email" placeholder="nhanvien@example.com" required value={form.email} onChange={handleChange} />
                    <Input id="full_name" label="Họ và tên *" type="text" placeholder="Nguyễn Văn A" required value={form.full_name} onChange={handleChange} />
                    <Input id="phone" label="Số điện thoại" type="text" placeholder="0901234567" value={form.phone} onChange={handleChange} />
                    <Input id="student_id" label="Mã sinh viên" type="text" placeholder="B22DCPT244" value={form.student_id} onChange={handleChange} />
                    <Input id="university" label="Trường đại học" type="text" placeholder="PTIT" value={form.university} onChange={handleChange} />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="ghost" onClick={handleCloseForm}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={loading}>Tạo tài khoản</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  )
}

export default EmployerDashboard
