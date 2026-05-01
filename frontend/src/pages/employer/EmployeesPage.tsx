import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles } from '../../api/employers'

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

const glassSelect = 'w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all'

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ email: '', full_name: '', phone: '', student_id: '', university: '', role_id: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  // Edit modal
  const [editTarget, setEditTarget]   = useState<any | null>(null)
  const [editForm, setEditForm]       = useState({ full_name: '', phone: '', student_id: '', university: '', role_id: '' })
  const [editError, setEditError]     = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget]     = useState<any | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)

  const fetchEmployees = () => {
    setLoading(true)
    getEmployees()
      .then(d => setEmployees(d.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEmployees()
    getRoles().then(d => setRoles(d.roles || [])).catch(console.error)
  }, [])

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
      const payload = { ...form, role_id: form.role_id || undefined }
      const res = await createEmployee(payload)
      setCreatedPassword(res.temp_password)
      setForm({ email: '', full_name: '', phone: '', student_id: '', university: '', role_id: '' })
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

  const openEdit = (emp: any) => {
    setEditTarget(emp)
    setEditForm({
      full_name:  emp.full_name  || '',
      phone:      emp.phone      || '',
      student_id: emp.student_id || '',
      university: emp.university || '',
      role_id:    emp.role_id    || '',
    })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true); setEditError('')
    try {
      await updateEmployee(editTarget.id, {
        full_name:  editForm.full_name  || undefined,
        phone:      editForm.phone      || undefined,
        student_id: editForm.student_id || undefined,
        university: editForm.university || undefined,
        role_id:    editForm.role_id    || null,
      })
      setEditTarget(null)
      fetchEmployees()
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Cập nhật thất bại.')
    } finally { setEditLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteEmployee(deleteTarget.id)
      setDeleteTarget(null)
      fetchEmployees()
    } catch (err: any) {
      setDeleteTarget(null)
    } finally { setDeleteLoading(false) }
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
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Vị trí / Chức danh</label>
                        {roles.length === 0 ? (
                          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl text-sm">
                            Chưa có vị trí nào.{' '}
                            <a href="/employer/roles" className="underline underline-offset-2 hover:text-amber-300 transition-colors">Tạo vị trí tại đây</a>
                          </div>
                        ) : (
                          <select
                            value={form.role_id}
                            onChange={e => setForm(prev => ({ ...prev, role_id: e.target.value }))}
                            className={glassSelect}
                          >
                            <option value="">-- Không có --</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        )}
                      </div>
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

        {/* Modal chỉnh sửa nhân viên */}
        <AnimatePresence>
          {editTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[8vh] overflow-y-auto">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass p-6 w-full max-w-md mb-8">
                <h2 className="text-base font-display font-semibold text-slate-100 mb-1">Chỉnh sửa nhân viên</h2>
                <p className="text-slate-500 text-sm mb-5">{editTarget.email}</p>
                {editError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                    {editError}
                  </div>
                )}
                <form onSubmit={handleEdit} className="space-y-3">
                  {[
                    { key: 'full_name',   label: 'Họ và tên',       type: 'text' },
                    { key: 'phone',       label: 'Số điện thoại',   type: 'tel' },
                    { key: 'student_id',  label: 'Mã sinh viên',    type: 'text' },
                    { key: 'university',  label: 'Trường đại học',  type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        value={(editForm as any)[f.key]}
                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full bg-slate-900/80 border border-white/[0.10] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Vị trí / Chức danh</label>
                    <select
                      value={editForm.role_id}
                      onChange={e => setEditForm(prev => ({ ...prev, role_id: e.target.value }))}
                      className={glassSelect}
                    >
                      <option value="">-- Không có --</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={editLoading}>Lưu thay đổi</Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm xóa nhân viên */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass p-6 w-full max-w-sm text-center">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-1">Vô hiệu hoá nhân viên?</h3>
                <p className="text-slate-400 text-sm mb-6">
                  <span className="font-semibold text-slate-200">{deleteTarget.full_name}</span> sẽ không thể đăng nhập. Lịch sử chấm công và lương vẫn được giữ lại.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="flex-1">Huỷ</Button>
                  <Button variant="danger" isLoading={deleteLoading} onClick={handleDelete} className="flex-1">Xác nhận</Button>
                </div>
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
                    {['Nhân viên', 'Email', 'Vị trí', 'Mã SV', 'Trường', 'Điểm uy tín', 'Ngày tham gia', ''].map(h => (
                      <th key={h} className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500">Đang tải...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
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
                      <td className="px-5 py-3.5">
                        {emp.role_name
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">{emp.role_name}</span>
                          : <span className="text-slate-600 text-sm">—</span>
                        }
                      </td>
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
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(emp)}
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-500/10"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                          >
                            Xóa
                          </button>
                        </div>
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
