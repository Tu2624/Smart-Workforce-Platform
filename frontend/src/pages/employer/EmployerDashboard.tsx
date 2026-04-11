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
  email: string
  full_name: string
  phone: string
  student_id: string
  university: string
}

interface CreatedEmployee {
  user: { id: string; email: string; role: string }
  temp_password: string
}

const EmployerDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedEmployee | null>(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<{ employees: number; today_shifts: number } | null>(null)

  React.useEffect(() => {
    apiClient.get('/employers/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
  }, [])

  const [form, setForm] = useState<CreateEmployeeForm>({
    email: '',
    full_name: '',
    phone: '',
    student_id: '',
    university: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCreated(null)

    try {
      const body: Record<string, string> = {
        email: form.email,
        full_name: form.full_name,
      }
      if (form.phone) body.phone = form.phone
      if (form.student_id) body.student_id = form.student_id
      if (form.university) body.university = form.university

      const response = await apiClient.post('/employers/employees', body)
      setCreated(response.data)
      setForm({ email: '', full_name: '', phone: '', student_id: '', university: '' })
      
      // Update stats optimistically or refetch
      if (stats) setStats({ ...stats, employees: stats.employees + 1 })
    } catch (err: any) {
      const data = err.response?.data
      if (data?.error === 'EMAIL_ALREADY_EXISTS') {
        setError('Email này đã tồn tại trong hệ thống.')
      } else if (data?.details?.length) {
        setError(data.details.map((d: any) => d.message).join(' | '))
      } else {
        setError(data?.message || 'Tạo tài khoản thất bại.')
      }
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

  const handleOpenForm = () => {
    setShowForm(true)
    setCreated(null)
    setError('')
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setCreated(null)
    setError('')
    setForm({ email: '', full_name: '', phone: '', student_id: '', university: '' })
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Bảng điều khiển</h1>
            <p className="text-slate-300 mt-1 font-medium">Quản lý nhân viên và ca làm việc</p>
          </div>
          <Button variant="primary" onClick={handleOpenForm}>
            + Tạo nhân viên
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glass delay={0.1}>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Ca hôm nay</p>
            <p className="text-4xl font-black text-slate-900">{stats ? stats.today_shifts : '—'}</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">{stats ? 'Đang mở' : 'Đang tải...'}</p>
          </Card>

          <Card glass delay={0.2}>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Chi phí lao động</p>
            <p className="text-4xl font-black text-slate-900">—</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">Tính năng đang phát triển</p>
          </Card>

          <Card glass delay={0.3}>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Nhân viên</p>
            <p className="text-4xl font-black text-slate-900">{stats ? stats.employees : '—'}</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">{stats ? 'Nhân viên đã tạo' : 'Đang tải...'}</p>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              key="create-employee-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Card glass>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-slate-900">Tạo tài khoản nhân viên</h2>
                  <button
                    onClick={handleCloseForm}
                    className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center border border-red-100"
                    >
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {created && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                    >
                      <p className="text-emerald-700 font-black text-sm mb-1">Tạo tài khoản thành công!</p>
                      <p className="text-emerald-600 text-sm mb-3">
                        Email: <span className="font-bold">{created.user.email}</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-2 font-mono text-lg font-bold text-slate-900 tracking-widest">
                          {created.temp_password}
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleCopy}>
                          {copied ? 'Đã sao chép!' : 'Sao chép'}
                        </Button>
                      </div>
                      <p className="text-xs text-emerald-500 mt-2">
                        Cung cấp mật khẩu tạm thời này cho nhân viên ngay bây giờ. Nó sẽ không hiển thị lại.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      id="email"
                      label="Email *"
                      type="email"
                      placeholder="nhanvien@example.com"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                    <Input
                      id="full_name"
                      label="Họ và tên *"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      required
                      value={form.full_name}
                      onChange={handleChange}
                    />
                    <Input
                      id="phone"
                      label="Số điện thoại"
                      type="text"
                      placeholder="0901234567"
                      value={form.phone}
                      onChange={handleChange}
                    />
                    <Input
                      id="student_id"
                      label="Mã sinh viên"
                      type="text"
                      placeholder="B22DCPT244"
                      value={form.student_id}
                      onChange={handleChange}
                    />
                    <Input
                      id="university"
                      label="Trường đại học"
                      type="text"
                      placeholder="PTIT"
                      value={form.university}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={handleCloseForm}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                      Tạo tài khoản
                    </Button>
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
