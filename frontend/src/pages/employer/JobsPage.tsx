import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getJobs, createJob, deleteJob } from '../../api/jobs'
import { Job } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  closed: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Đang tuyển', paused: 'Tạm dừng', closed: 'Đã đóng',
}

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [form, setForm] = useState({ title: '', hourly_rate: '', max_workers: '', description: '', required_skills: '' })

  const fetchJobs = async () => {
    try {
      const data = await getJobs()
      setJobs(data.jobs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.id]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createJob({
        title: form.title,
        hourly_rate: parseFloat(form.hourly_rate),
        max_workers: parseInt(form.max_workers),
        description: form.description || undefined,
        required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setForm({ title: '', hourly_rate: '', max_workers: '', description: '', required_skills: '' })
      setShowForm(false)
      fetchJobs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo việc làm thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (job: Job) => {
    setDeleteError('')
    if (!window.confirm(`Xóa việc làm "${job.title}"?`)) return
    try {
      await deleteJob(job.id)
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } catch (err: any) {
      const code = err.response?.data?.error
      if (code === 'CANNOT_DELETE_JOB') setDeleteError(`Không thể xóa "${job.title}" vì còn ca làm đang hoạt động.`)
      else setDeleteError(err.response?.data?.message || 'Xóa thất bại.')
    }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Việc làm</h1>
            <p className="text-slate-500 text-sm mt-0.5">{jobs.length} việc làm</p>
          </div>
          <Button variant="primary" onClick={() => { setShowForm(true); setError('') }}>+ Tạo việc làm</Button>
        </motion.div>

        <AnimatePresence>
          {deleteError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {deleteError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div key="job-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-display font-semibold text-slate-100">Tạo việc làm mới</h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/[0.06]" aria-label="Đóng">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input id="title" label="Tên việc làm *" placeholder="Nhân viên phục vụ" required value={form.title} onChange={handleChange} />
                    <Input id="hourly_rate" label="Lương/giờ (VNĐ) *" type="number" placeholder="30000" required value={form.hourly_rate} onChange={handleChange} />
                    <Input id="max_workers" label="Số lượng tối đa *" type="number" placeholder="5" required value={form.max_workers} onChange={handleChange} />
                    <Input id="required_skills" label="Kỹ năng yêu cầu" placeholder="giao tiếp, nhanh nhẹn (cách nhau bằng dấu phẩy)" value={form.required_skills} onChange={handleChange} />
                    <Input id="description" label="Mô tả" placeholder="Mô tả công việc..." value={form.description} onChange={handleChange} className="md:col-span-2" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={submitting}>Tạo việc làm</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job list */}
        <motion.div variants={itemVariants} className="space-y-3">
          {loading ? (
            <p className="text-slate-500 text-center py-12">Đang tải...</p>
          ) : jobs.length === 0 ? (
            <Card className="p-8"><p className="text-slate-500 text-center">Chưa có việc làm nào. Tạo việc làm đầu tiên!</p></Card>
          ) : (
            jobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-100">{job.title}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[job.status]}`}>
                          {STATUS_LABELS[job.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-slate-500 text-sm">{job.hourly_rate.toLocaleString('vi-VN')}đ/giờ · Tối đa {job.max_workers} người</span>
                        {job.required_skills?.map((skill: string) => (
                          <span key={skill} className="bg-white/[0.06] text-slate-400 rounded-full px-2 py-0.5 text-xs border border-white/[0.08]">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/employer/jobs/${job.id}`}>
                        <Button variant="secondary" size="sm">Chi tiết</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(job)}>Xóa</Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default JobsPage
