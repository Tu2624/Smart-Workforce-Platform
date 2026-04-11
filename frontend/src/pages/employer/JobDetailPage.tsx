import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getJob, updateJob, updateJobStatus } from '../../api/jobs'
import { getShifts, createShift } from '../../api/shifts'
import { Job, Shift } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700', paused: 'bg-amber-100 text-amber-700', closed: 'bg-slate-100 text-slate-500',
  open: 'bg-emerald-100 text-emerald-700', full: 'bg-red-100 text-red-600',
  ongoing: 'bg-indigo-100 text-indigo-700', completed: 'bg-slate-100 text-slate-500', cancelled: 'bg-rose-50 text-rose-400',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Đang tuyển', paused: 'Tạm dừng', closed: 'Đã đóng',
  open: 'Mở', full: 'Đầy', ongoing: 'Đang diễn ra', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}
const formatDateTime = (dt: string) => new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
const toDatetimeLocal = (dt: string) => new Date(dt).toISOString().slice(0, 16)

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [job, setJob] = useState<Job | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', hourly_rate: '', max_workers: '', description: '', required_skills: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [showShiftForm, setShowShiftForm] = useState(false)
  const [shiftForm, setShiftForm] = useState({ title: '', start_time: '', end_time: '', max_workers: '', auto_assign: false })
  const [shiftSubmitting, setShiftSubmitting] = useState(false)
  const [shiftError, setShiftError] = useState('')

  const fetchAll = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [jobData, shiftData] = await Promise.all([getJob(id), getShifts({ job_id: id })])
      setJob(jobData.job)
      setShifts(shiftData.shifts)
      setEditForm({
        title: jobData.job.title,
        hourly_rate: jobData.job.hourly_rate.toString(),
        max_workers: jobData.job.max_workers.toString(),
        description: jobData.job.description || '',
        required_skills: (jobData.job.required_skills || []).join(', '),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true); setEditError('')
    try {
      await updateJob(id!, {
        title: editForm.title,
        hourly_rate: parseFloat(editForm.hourly_rate),
        max_workers: parseInt(editForm.max_workers),
        description: editForm.description || undefined,
        required_skills: editForm.required_skills ? editForm.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setEditing(false)
      fetchAll()
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Cập nhật thất bại.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleStatusChange = async (status: 'active' | 'paused' | 'closed') => {
    try { await updateJobStatus(id!, status); fetchAll() } catch {}
  }

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShiftSubmitting(true); setShiftError('')
    try {
      await createShift({
        job_id: id!,
        title: shiftForm.title || undefined,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        max_workers: parseInt(shiftForm.max_workers),
        auto_assign: shiftForm.auto_assign,
      })
      setShiftForm({ title: '', start_time: '', end_time: '', max_workers: '', auto_assign: false })
      setShowShiftForm(false)
      fetchAll()
    } catch (err: any) {
      setShiftError(err.response?.data?.message || 'Tạo ca thất bại.')
    } finally {
      setShiftSubmitting(false)
    }
  }

  if (loading) return <DashboardLayout><p className="text-slate-400 text-center py-20">Đang tải...</p></DashboardLayout>
  if (!job) return <DashboardLayout><p className="text-slate-400 text-center py-20">Không tìm thấy việc làm.</p></DashboardLayout>

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Breadcrumb */}
        <motion.div variants={itemVariants}>
          <Link to="/employer/jobs" className="text-slate-400 hover:text-white text-sm transition-colors">← Việc làm</Link>
        </motion.div>

        {/* Job info card */}
        <motion.div variants={itemVariants}>
          <Card glass>
            {!editing ? (
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-black text-slate-900">{job.title}</h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[job.status]}`}>{STATUS_LABELS[job.status]}</span>
                    </div>
                    <p className="text-slate-500 mt-2">{job.hourly_rate.toLocaleString('vi-VN')}đ/giờ · Tối đa {job.max_workers} người</p>
                    {job.description && <p className="text-slate-600 text-sm mt-2">{job.description}</p>}
                    {job.required_skills?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {job.required_skills.map(s => (
                          <span key={s} className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Chỉnh sửa</Button>
                    {job.status === 'active' && <Button variant="secondary" size="sm" onClick={() => handleStatusChange('paused')}>Tạm dừng</Button>}
                    {job.status === 'paused' && <Button variant="primary" size="sm" onClick={() => handleStatusChange('active')}>Kích hoạt</Button>}
                    {job.status !== 'closed' && <Button variant="danger" size="sm" onClick={() => handleStatusChange('closed')}>Đóng</Button>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-5">Chỉnh sửa việc làm</h2>
                <AnimatePresence mode="wait">
                  {editError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100">{editError}</motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="title" label="Tên việc làm *" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                    <Input id="hourly_rate" label="Lương/giờ *" type="number" required value={editForm.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
                    <Input id="max_workers" label="Số lượng tối đa *" type="number" required value={editForm.max_workers} onChange={e => setEditForm({ ...editForm, max_workers: e.target.value })} />
                    <Input id="required_skills" label="Kỹ năng" placeholder="giao tiếp, nhanh nhẹn" value={editForm.required_skills} onChange={e => setEditForm({ ...editForm, required_skills: e.target.value })} />
                    <Input id="description" label="Mô tả" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="md:col-span-2" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={editLoading}>Lưu thay đổi</Button>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Shifts section */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">Ca làm việc ({shifts.length})</h2>
            <Button variant="primary" size="sm" onClick={() => { setShowShiftForm(true); setShiftError('') }}>+ Tạo ca</Button>
          </div>

          <AnimatePresence>
            {showShiftForm && (
              <motion.div key="shift-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden mb-4">
                <Card glass>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-slate-900">Tạo ca làm mới</h3>
                    <button onClick={() => setShowShiftForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
                  </div>
                  <AnimatePresence mode="wait">
                    {shiftError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100">{shiftError}</motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleShiftSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input id="shift-title" label="Tên ca (tuỳ chọn)" placeholder="Ca sáng thứ 2" value={shiftForm.title} onChange={e => setShiftForm({ ...shiftForm, title: e.target.value })} />
                      <Input id="shift-max" label="Số lượng tối đa *" type="number" required placeholder="3" value={shiftForm.max_workers} onChange={e => setShiftForm({ ...shiftForm, max_workers: e.target.value })} />
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bắt đầu *</label>
                        <input type="datetime-local" required value={shiftForm.start_time}
                          onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kết thúc *</label>
                        <input type="datetime-local" required value={shiftForm.end_time}
                          onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={shiftForm.auto_assign} onChange={e => setShiftForm({ ...shiftForm, auto_assign: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Tự động phân công (auto-assign)</span>
                    </label>
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setShowShiftForm(false)}>Hủy</Button>
                      <Button type="submit" variant="primary" isLoading={shiftSubmitting}>Tạo ca</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {shifts.length === 0 ? (
              <Card glass><p className="text-slate-400 text-center py-6">Chưa có ca làm nào cho việc làm này.</p></Card>
            ) : (
              shifts.map((shift, i) => (
                <motion.div key={shift.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card glass className="!p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{shift.title || `Ca #${i + 1}`}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[shift.status]}`}>{STATUS_LABELS[shift.status]}</span>
                        </div>
                        <p className="text-slate-500 text-sm mt-0.5">
                          {formatDateTime(shift.start_time)} → {formatDateTime(shift.end_time)} · {shift.current_workers}/{shift.max_workers} người
                        </p>
                      </div>
                      <Link to={`/employer/shifts/${shift.id}`}>
                        <Button variant="secondary" size="sm">Chi tiết</Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default JobDetailPage
