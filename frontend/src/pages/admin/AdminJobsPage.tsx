import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import apiClient from '../../api/client'

const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/jobs') // This now works for Admin too
      .then(res => setJobs(res.data.jobs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Tất cả việc làm</h1>
          <p className="text-slate-400 mt-1">Danh sách công việc trên toàn hệ thống (Read-only)</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-400 text-center col-span-full py-12">Đang tải...</p>
          ) : jobs.length === 0 ? (
            <Card glass className="col-span-full">
              <p className="text-slate-400 text-center py-8">Chưa có việc làm nào được tạo.</p>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} glass className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    job.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mb-4 line-clamp-2 flex-grow">{job.description || 'Không có mô tả.'}</p>
                <div className="pt-4 border-t border-slate-700/30 flex justify-between items-center text-sm">
                  <span className="text-emerald-600 font-bold">{parseFloat(job.hourly_rate).toLocaleString('vi-VN')}₫/giờ</span>
                  <span className="text-slate-400">ID: {job.id.slice(0, 8)}</span>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default AdminJobsPage
