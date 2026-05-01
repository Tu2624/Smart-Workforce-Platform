import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getRoles, createRole, updateRole, deleteRole } from '../../api/employers'

const glassInput = 'w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all'

const RolesPage: React.FC = () => {
  const [roles, setRoles]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)
  const [form, setForm]             = useState({ name: '', description: '' })
  const [formError, setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchRoles = (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    getRoles()
      .then(d => setRoles(d.roles || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRoles() }, [])

  const openCreate = () => {
    setEditingRole(null)
    setForm({ name: '', description: '' })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (role: any) => {
    setEditingRole(role)
    setForm({ name: role.name, description: role.description || '' })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRole(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Tên vị trí không được để trống.'); return }
    setFormLoading(true); setFormError('')
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: form.name.trim(), description: form.description.trim() || undefined })
      } else {
        await createRole({ name: form.name.trim(), description: form.description.trim() || undefined })
      }
      closeModal()
      fetchRoles(false)
    } catch (err: any) {
      const code = err.response?.data?.error
      if (code === 'ROLE_NAME_DUPLICATE') {
        setFormError('Tên vị trí đã tồn tại trong công ty.')
      } else {
        setFormError(err.response?.data?.message || 'Thao tác thất bại.')
      }
    } finally { setFormLoading(false) }
  }

  const handleDelete = async (role: any) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vị trí "${role.name}"?\nNhân viên hiện tại sẽ không bị xóa.`)) return
    try {
      await deleteRole(role.id)
      fetchRoles(false)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại.')
    }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Vị trí / Vai trò</h1>
            <p className="text-slate-500 text-sm mt-0.5">{roles.length} vị trí đã tạo</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Thêm vị trí</Button>
        </motion.div>

        {/* Modal tạo/sửa vị trí */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.10] rounded-2xl shadow-glass p-6 w-full max-w-md">
                <h2 className="text-base font-display font-semibold text-slate-100 mb-5">
                  {editingRole ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}
                </h2>
                {formError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Tên vị trí *</label>
                    <input
                      type="text"
                      placeholder="VD: Thu ngân, Phục vụ, Bảo vệ..."
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className={glassInput}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Mô tả</label>
                    <input
                      type="text"
                      placeholder="Mô tả ngắn về vị trí này..."
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className={glassInput}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-1">
                    <Button type="button" variant="ghost" onClick={closeModal}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={formLoading}>
                      {editingRole ? 'Lưu thay đổi' : 'Tạo vị trí'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bảng danh sách vị trí */}
        <motion.div variants={itemVariants}>
          <Card glass className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {['Tên vị trí', 'Mô tả', 'Ngày tạo', 'Hành động'].map(h => (
                      <th key={h} className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">Đang tải...</td></tr>
                  ) : roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-slate-500">
                        <p className="font-semibold text-slate-400 mb-1">Chưa có vị trí nào</p>
                        <p className="text-sm">Bấm "+ Thêm vị trí" để tạo vị trí đầu tiên.</p>
                      </td>
                    </tr>
                  ) : roles.map(role => (
                    <tr key={role.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium">
                          {role.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{role.description || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-sm">
                        {new Date(role.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(role)}
                            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
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

export default RolesPage
