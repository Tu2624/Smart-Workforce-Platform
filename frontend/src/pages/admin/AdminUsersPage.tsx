import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-400 mt-1">Danh sách tất cả tài khoản trên hệ thống</p>
        </motion.div>

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
