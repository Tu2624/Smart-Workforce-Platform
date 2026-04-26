import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getEmployees, createEmployee } from '../../api/employers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ email: '', full_name: '', phone: '', student_id: '', university: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const fetchEmployees = () => {
    setLoading(true)
    getEmployees()
      .then(d => setEmployees(d.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEmployees() }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.full_name.trim()) errs.full_name = 'Vui lòng nhập họ và tên.'
    if (!EMAIL_RE.test(form.email)) errs.email = 'Email không hợp lệ.'
    return errs
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setFormLoading(true); setFormError('')
    try {
      const res = await createEmployee(form)
      setCreatedPassword(res.temp_password)
      setForm({ email: '', full_name: '', phone: '', student_id: '', university: '' })
      fetchEmployees()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Tạo tài khoản thất bại.')
    } finally { setFormLoading(false) }
  }

  const closeModal = () => {
    setShowModal(false)
    setCreatedPassword(null)
    setFormError('')
    setFieldErrors({})
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Nhân viên</h1>
            <p className="text-slate-500 text-sm mt-0.5">{employees.length} nhân viên đang hoạt động</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>+ Thêm nhân viên</Button>
        </motion.div>

        {/* Modal tạo nhân viên */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[8vh] overflow-y-auto">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass p-6 w-full max-w-md mb-8">

                {createdPassword ? (
                  <div className="text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-100">Tạo tài khoản thành công!</h2>
                    <p className="text-slate-400 text-sm">Cấp mật khẩu tạm thời này cho nhân viên. Chỉ hiển thị một lần.</p>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
                      <p className="text-[10px] text-emerald-500/70 font-semibold uppercase tracking-widest mb-2">Mật khẩu tạm thời</p>
                      <p className="text-2xl font-mono font-bold text-emerald-300 tracking-widest select-all">{createdPassword}</p>
                    </div>
                    <Button variant="primary" onClick={closeModal} className="w-full">Đóng</Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-display font-semibold text-slate-100 mb-5">Thêm nhân viên mới</h2>
                    {formError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                        {formError}
                      </div>
                    )}
                    <form onSubmit={handleCreate} className="space-y-3">
                      {[
                        { key: 'full_name',   label: 'Họ và tên *',     type: 'text' },
                        { key: 'email',       label: 'Email *',          type: 'email' },
                        { key: 'phone',       label: 'Số điện thoại',    type: 'tel' },
                        { key: 'student_id',  label: 'Mã sinh viên',     type: 'text' },
                        { key: 'university',  label: 'Trường đại học',   type: 'text' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                          <input
                            type={f.type}
                            value={(form as any)[f.key]}
                            onChange={e => {
                              setForm(prev => ({ ...prev, [f.key]: e.target.value }))
                              setFieldErrors(prev => ({ ...prev, [f.key]: '' }))
                            }}
                            className={`w-full bg-slate-900/80 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                              fieldErrors[f.key] ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/15' : 'border-white/[0.10] focus:border-cyan-500/60 focus:ring-cyan-500/15'
                            }`}
                          />
                          {fieldErrors[f.key] && <p className="text-red-400 text-xs mt-1">{fieldErrors[f.key]}</p>}
                        </div>
                      ))}
                      <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="ghost" onClick={closeModal}>Hủy</Button>
                        <Button type="submit" variant="primary" isLoading={formLoading}>Tạo tài khoản</Button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bảng danh sách nhân viên */}
        <motion.div variants={itemVariants}>
          <Card glass className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {['Nhân viên', 'Email', 'Mã SV', 'Trường', 'Điểm uy tín', 'Ngày tham gia'].map(h => (
                      <th key={h} className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500">Đang tải...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                        <p className="font-semibold text-slate-400 mb-1">Chưa có nhân viên nào</p>
                        <p className="text-sm">Bấm "+ Thêm nhân viên" để tạo tài khoản đầu tiên.</p>
                      </td>
                    </tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-200">{emp.full_name}</p>
                        {emp.phone && <p className="text-xs text-slate-500 mt-0.5">{emp.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{emp.email}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm font-mono">{emp.student_id || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{emp.university || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold text-base ${reputationColor(emp.reputation_score)}`}>
                          {emp.reputation_score}
                        </span>
                        <span className={`ml-1.5 text-xs ${reputationColor(emp.reputation_score)}`}>
                          {reputationLabel(emp.reputation_score)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-sm">
                        {new Date(emp.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}

export default EmployeesPage
