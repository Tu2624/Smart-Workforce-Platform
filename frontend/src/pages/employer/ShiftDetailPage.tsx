import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getShift, updateShift, deleteShift, getShiftRegistrations, reviewRegistration } from '../../api/shifts'
import { getShiftAttendance } from '../../api/attendance'
import { createRating, getStudentRatings } from '../../api/ratings'
import { useAuthStore } from '../../store/useAuthStore'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  full: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  ongoing: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
  completed: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20',
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Mở', full: 'Đầy', ongoing: 'Đang diễn ra', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}
const REG_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
}
const REG_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', cancelled: 'Đã huỷ',
}
const ATTEND_STYLES: Record<string, string> = {
  on_time: 'text-emerald-400', late: 'text-amber-400', absent: 'text-red-400',
  incomplete: 'text-slate-500', pending: 'text-slate-500',
}
const ATTEND_LABELS: Record<string, string> = {
  on_time: 'Đúng giờ', late: 'Trễ', absent: 'Vắng', incomplete: 'Chưa checkout', pending: 'Chưa điểm danh',
}

const formatDateTime = (dt: string) => new Date(dt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
const toDatetimeLocal = (dt: string) => new Date(dt).toISOString().slice(0, 16)

const ShiftDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const token = useAuthStore(s => s.token)
  const socketRef = useRef<Socket | null>(null)

  const [shift, setShift] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', start_time: '', end_time: '', max_workers: '', auto_assign: false })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const [registrations, setRegistrations] = useState<any[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState('')

  const [attendance, setAttendance] = useState<any[]>([])
  const [attendLoading, setAttendLoading] = useState(false)

  const [existingRatings, setExistingRatings] = useState<Record<string, number>>({})
  const [ratingForm, setRatingForm] = useState<Record<string, { score: number; comment: string }>>({})
  const [ratingLoading, setRatingLoading] = useState<string | null>(null)
  const [ratingError, setRatingError] = useState('')

  const fetchShift = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getShift(id)
      setShift(data.shift)
      setEditForm({
        title: data.shift.title || '',
        start_time: toDatetimeLocal(data.shift.start_time),
        end_time: toDatetimeLocal(data.shift.end_time),
        max_workers: data.shift.max_workers.toString(),
        auto_assign: data.shift.auto_assign,
      })
    } finally { setLoading(false) }
  }

  const fetchRegistrations = async () => {
    if (!id) return
    setRegLoading(true)
    try {
      const data = await getShiftRegistrations(id)
      setRegistrations(data.registrations)
    } catch {} finally { setRegLoading(false) }
  }

  const fetchAttendance = async () => {
    if (!id) return
    setAttendLoading(true)
    try {
      const data = await getShiftAttendance(id)
      setAttendance(data.attendance)
    } catch {} finally { setAttendLoading(false) }
  }

  const fetchRatings = async (approvedStudentIds: string[]) => {
    const results = await Promise.all(
      approvedStudentIds.map(async (sid) => {
        try {
          const data = await getStudentRatings(sid)
          const hit = (data.ratings as any[]).find((r: any) => r.shift_id === id)
          return hit ? ({ sid, score: hit.score as number }) : null
        } catch {
          return null
        }
      })
    )
    const ratedMap: Record<string, number> = {}
    for (const entry of results) {
      if (entry) ratedMap[entry.sid] = entry.score
    }
    setExistingRatings(ratedMap)
  }

  useEffect(() => {
    fetchShift()
    fetchRegistrations()
    fetchAttendance()
  }, [id])

  useEffect(() => {
    if (shift?.status === 'completed') {
      const approved = registrations.filter(r => r.status === 'approved').map(r => r.student_id as string).filter(Boolean)
      if (approved.length) fetchRatings(approved)
    }
  }, [shift?.status, registrations])

  // Real-time: refresh registrations when a student registers
  useEffect(() => {
    if (!id || !token) return
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
    const socket: Socket = io(SOCKET_URL, { auth: { token } })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join:shift', { shift_id: id })
    })
    socket.on('shift:registered', () => {
      fetchRegistrations()
      fetchShift()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [id, token])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true); setEditError('')
    try {
      await updateShift(id!, {
        title: editForm.title || undefined,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        max_workers: parseInt(editForm.max_workers),
        auto_assign: editForm.auto_assign,
      })
      setEditing(false)
      fetchShift()
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Cập nhật thất bại.')
    } finally { setEditLoading(false) }
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    setCancelError('')
    try {
      await deleteShift(id!)
      fetchShift()
      setCancelConfirm(false)
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Huỷ ca thất bại.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleRate = async (studentId: string) => {
    const form = ratingForm[studentId]
    if (!form?.score) { setRatingError('Vui lòng chọn số sao.'); return }
    setRatingLoading(studentId)
    setRatingError('')
    try {
      await createRating({ shift_id: id!, student_id: studentId, score: form.score, comment: form.comment })
      setExistingRatings(prev => ({ ...prev, [studentId]: form.score }))
    } catch (err: any) {
      setRatingError(err.response?.data?.message || 'Đánh giá thất bại.')
    } finally { setRatingLoading(null) }
  }

  const handleReview = async (regId: string, status: 'approved' | 'rejected') => {
    setReviewingId(regId)
    setReviewError('')
    try {
      await reviewRegistration(id!, regId, status)
      await Promise.all([fetchRegistrations(), fetchShift()])
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Thao tác thất bại.')
    } finally { setReviewingId(null) }
  }

  if (loading) return <DashboardLayout><p className="text-slate-400 text-center py-20">Đang tải...</p></DashboardLayout>
  if (!shift) return <DashboardLayout><p className="text-slate-400 text-center py-20">Không tìm thấy ca làm.</p></DashboardLayout>

  const canEdit = shift.status === 'open'

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Link to={shift.job?.id ? `/employer/jobs/${shift.job.id}` : '/employer/shifts'}
            className="text-slate-400 hover:text-white text-sm transition-colors">
            ← {shift.job?.id ? 'Quay lại việc làm' : 'Ca làm việc'}
          </Link>
        </motion.div>

        {/* Shift info */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            {!editing ? (
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-xl font-display font-bold text-white">{shift.title || 'Ca làm việc'}</h1>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[shift.status]}`}>{STATUS_LABELS[shift.status]}</span>
                    </div>
                    {shift.job && (
                      <p className="text-cyan-400/80 font-medium text-sm mt-1">
                        {shift.job.title} · {parseFloat(shift.job.hourly_rate).toLocaleString('vi-VN')}đ/giờ
                      </p>
                    )}
                    <div className="mt-3 space-y-1 text-slate-400 text-sm">
                      <p>Bắt đầu: <span className="font-medium text-slate-300">{formatDateTime(shift.start_time)}</span></p>
                      <p>Kết thúc: <span className="font-medium text-slate-300">{formatDateTime(shift.end_time)}</span></p>
                      <p>Nhân viên: <span className="font-medium text-slate-300">{shift.current_workers}/{shift.max_workers}</span></p>
                      <p>Auto-assign: <span className="font-medium text-slate-300">{shift.auto_assign ? 'Bật' : 'Tắt'}</span></p>
                    </div>
                  </div>
                  {shift.status !== 'cancelled' && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2 flex-wrap justify-end">
                        {canEdit && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
                        {!cancelConfirm
                          ? <Button variant="danger" size="sm" onClick={() => { setCancelConfirm(true); setCancelError('') }}>Huỷ ca</Button>
                          : (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                              <span className="text-red-400 text-xs font-semibold">Xác nhận huỷ?</span>
                              <Button variant="danger" size="sm" isLoading={cancelLoading} onClick={handleCancel}>Huỷ ca</Button>
                              <Button variant="ghost" size="sm" onClick={() => setCancelConfirm(false)}>Không</Button>
                            </div>
                          )
                        }
                      </div>
                      {cancelError && <p className="text-red-400 text-xs">{cancelError}</p>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-base font-display font-semibold text-slate-100 mb-5">Chỉnh sửa ca làm</h2>
                <AnimatePresence mode="wait">
                  {editError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{editError}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Tên ca (tuỳ chọn)" value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all" />
                    <input type="number" placeholder="Số lượng tối đa" required value={editForm.max_workers}
                      onChange={e => setEditForm({ ...editForm, max_workers: e.target.value })}
                      className="bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all" />
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Bắt đầu</label>
                      <input type="datetime-local" required value={editForm.start_time}
                        onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Kết thúc</label>
                      <input type="datetime-local" required value={editForm.end_time}
                        onChange={e => setEditForm({ ...editForm, end_time: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.auto_assign}
                      onChange={e => setEditForm({ ...editForm, auto_assign: e.target.checked })}
                      className="rounded border-white/[0.15] bg-slate-800 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0" />
                    <span className="text-sm text-slate-400">Auto-assign</span>
                  </label>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                    <Button type="submit" variant="primary" isLoading={editLoading}>Lưu thay đổi</Button>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Registrations */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">
              Danh sách đăng ký ({registrations.length})
            </h2>
            {reviewError && <p className="text-red-400 text-sm mb-3">{reviewError}</p>}
            {regLoading ? (
              <p className="text-slate-500 text-sm text-center py-6">Đang tải...</p>
            ) : registrations.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có ai đăng ký ca này.</p>
            ) : (
              <div>
                {registrations.map(reg => (
                  <div key={reg.id} className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 text-sm truncate">{reg.full_name}</p>
                      <p className="text-xs text-slate-500">{reg.email} · ĐUY: {Number(reg.reputation_score).toFixed(1)}</p>
                      {reg.university && <p className="text-xs text-slate-600">{reg.university}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${REG_STYLES[reg.status]}`}>
                        {REG_LABELS[reg.status]}
                      </span>
                      {reg.status === 'pending' && (
                        <>
                          <Button variant="primary" size="sm"
                            isLoading={reviewingId === reg.id}
                            onClick={() => handleReview(reg.id, 'approved')}>
                            Duyệt
                          </Button>
                          <Button variant="danger" size="sm"
                            isLoading={reviewingId === reg.id}
                            onClick={() => handleReview(reg.id, 'rejected')}>
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Attendance */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">
              Điểm danh ({attendance.length})
            </h2>
            {attendLoading ? (
              <p className="text-slate-500 text-sm text-center py-6">Đang tải...</p>
            ) : attendance.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có dữ liệu điểm danh.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nhân viên</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Check-in</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Check-out</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Giờ làm</th>
                      <th className="pb-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] transition-colors">
                        <td className="py-2.5 pr-4 font-semibold text-slate-100">{a.full_name}</td>
                        <td className="py-2.5 pr-4 text-slate-400">{a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-400">{a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-400">{a.hours_worked != null ? `${Number(a.hours_worked).toFixed(1)}h` : '—'}</td>
                        <td className={`py-2.5 font-semibold text-xs ${ATTEND_STYLES[a.status]}`}>{ATTEND_LABELS[a.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
        {/* Ratings — chỉ hiện khi shift completed */}
        {shift.status === 'completed' && registrations.filter(r => r.status === 'approved').length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-5">
              <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Đánh giá nhân viên</h2>
              {ratingError && <p className="text-red-400 text-sm mb-3">{ratingError}</p>}
              <div className="space-y-3">
                {registrations.filter(r => r.status === 'approved').map(reg => {
                  const studentId = reg.student_id as string
                  const rated = existingRatings[studentId]
                  const form = ratingForm[studentId] || { score: 0, comment: '' }
                  return (
                    <div key={reg.id} className="border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-semibold text-slate-100 text-sm">{reg.full_name}</p>
                          <p className="text-xs text-slate-500">{reg.email}</p>
                        </div>
                        {rated ? (
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={`text-lg ${s <= rated ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                            ))}
                            <span className="text-xs text-slate-500 ml-1">Đã đánh giá</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                <button key={s} onClick={() => setRatingForm(prev => ({ ...prev, [studentId]: { ...form, score: s } }))}
                                  className={`text-2xl transition-colors ${s <= form.score ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'}`}>
                                  ★
                                </button>
                              ))}
                            </div>
                            <input
                              type="text" placeholder="Nhận xét (tuỳ chọn)"
                              value={form.comment}
                              onChange={e => setRatingForm(prev => ({ ...prev, [studentId]: { ...form, comment: e.target.value } }))}
                              className="bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 w-48 transition-all"
                            />
                            <Button variant="primary" size="sm"
                              isLoading={ratingLoading === studentId}
                              onClick={() => handleRate(studentId)}>
                              Gửi
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}

export default ShiftDetailPage
