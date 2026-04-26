import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', phone: '', company_name: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  const fetchUsers = () => {
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.full_name.trim()) errs.full_name = 'Vui lòng nhập họ và tên.'
    if (!EMAIL_RE.test(form.email)) errs.email = 'Email không hợp lệ.'
    if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự.'
    return errs
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setFormLoading(true); setFormError('')
    try {
      await apiClient.post('/admin/employers', form)
      setShowModal(false)
      setForm({ email: '', full_name: '', password: '', phone: '', company_name: '' })
      setSuccessMsg('Tạo tài khoản employer thành công!')
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Tạo tài khoản thất bại.')
    } finally { setFormLoading(false) }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Quản lý người dùng</h1>
            <p className="text-slate-500 text-sm mt-0.5">Danh sách tất cả tài khoản trên hệ thống</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>+ Tạo Employer</Button>
        </motion.div>

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm font-medium">
            ✓ {successMsg}
          </motion.div>
        )}

        {/* Modal tạo employer */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[8vh] overflow-y-auto">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass p-6 w-full max-w-md mb-8">
                <h2 className="text-base font-display font-semibold text-slate-100 mb-5">Tạo tài khoản Employer</h2>
                {formError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleCreate} className="space-y-3">
                  {[
                    { key: 'full_name', label: 'Họ và tên *', type: 'text' },
                    { key: 'email', label: 'Email *', type: 'email' },
                    { key: 'password', label: 'Mật khẩu * (tối thiểu 6 ký tự)', type: 'password' },
                    { key: 'phone', label: 'Số điện thoại', type: 'tel' },
                    { key: 'company_name', label: 'Tên công ty', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]}
                        onChange={e => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setFieldErrors(prev => ({ ...prev, [f.key]: '' })) }}
                        className={`w-full bg-slate-900/80 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${fieldErrors[f.key] ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/15' : 'border-white/[0.10] focus:border-cyan-500/60 focus:ring-cyan-500/15'}`} />
                      {fieldErrors[f.key] && <p className="text-red-400 text-xs mt-1">{fieldErrors[f.key]}</p>}
                    </div>
                  ))}
                  <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setFormError('') }}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={formLoading}>Tạo tài khoản</Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <Card glass className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Người dùng</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Vai trò</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500">Đang tải...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500">Chưa có người dùng nào.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-200">{u.full_name}</p>
                          <p className="text-xs text-slate-600 font-mono">{u.id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20' :
                            u.role === 'employer' ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20' :
                            'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-sm">{u.email}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-sm">
                          {new Date(u.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default AdminUsersPage
