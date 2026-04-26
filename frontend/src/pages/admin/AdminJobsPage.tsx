import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  closed: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Đang tuyển', paused: 'Tạm dừng', closed: 'Đã đóng',
}

const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/jobs')
      .then(res => setJobs(res.data.jobs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Tất cả việc làm</h1>
          <p className="text-slate-500 text-sm mt-0.5">Danh sách công việc trên toàn hệ thống (Read-only)</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Việc làm</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest hidden md:table-cell">Mô tả</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Lương/giờ</th>
                    <th className="px-5 pb-3 pt-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500">Đang tải...</td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500">Chưa có việc làm nào được tạo.</td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-200">{job.title}</p>
                          <p className="text-xs text-slate-600 font-mono mt-0.5">{job.id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-sm max-w-xs hidden md:table-cell">
                          <p className="line-clamp-2">{job.description || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-cyan-400 font-semibold text-sm tabular-nums">
                          {parseFloat(job.hourly_rate).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[job.status] || 'bg-slate-500/10 text-slate-400'}`}>
                            {STATUS_LABELS[job.status] || job.status}
                          </span>
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

export default AdminJobsPage
