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
            <h1 className="text-3xl font-black text-white tracking-tight">Quản lý người dùng</h1>
            <p className="text-slate-400 mt-1">Danh sách tất cả tài khoản trên hệ thống</p>
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-xl font-black text-slate-900 mb-5">Tạo tài khoản Employer</h2>
                {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl px-4 py-2">{formError}</p>}
                <form onSubmit={handleCreate} className="space-y-3">
                  {[
                    { key: 'full_name', label: 'Họ và tên *', type: 'text' },
                    { key: 'email', label: 'Email *', type: 'email' },
                    { key: 'password', label: 'Mật khẩu * (tối thiểu 6 ký tự)', type: 'password' },
                    { key: 'phone', label: 'Số điện thoại', type: 'tel' },
                    { key: 'company_name', label: 'Tên công ty', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]}
                        onChange={e => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setFieldErrors(prev => ({ ...prev, [f.key]: '' })) }}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${fieldErrors[f.key] ? 'border-red-400' : 'border-slate-200'}`} />
                      {fieldErrors[f.key] && <p className="text-red-500 text-xs mt-1">{fieldErrors[f.key]}</p>}
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
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Đang tải...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Chưa có người dùng nào.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500 font-mono">{u.id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-rose-100 text-rose-600' :
                            u.role === 'employer' ? 'bg-indigo-100 text-indigo-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm font-medium">{u.email}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
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
