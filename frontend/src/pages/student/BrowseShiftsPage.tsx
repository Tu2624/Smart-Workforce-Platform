import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getShifts, registerShift, cancelRegistration } from '../../api/shifts'
import { useNotificationStore } from '../../store/useNotificationStore'

const formatDateTime = (dt: string) =>
  new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

const BrowseShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const shiftRefreshTick = useNotificationStore(s => s.shiftRefreshTick)

  const fetchShifts = () => {
    setLoading(true)
    getShifts({ limit: 100 })
      .then(data => {
        setShifts(data.shifts)
        setFiltered(data.shifts)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchShifts() }, [])
  useEffect(() => { if (shiftRefreshTick > 0) fetchShifts() }, [shiftRefreshTick])

  useEffect(() => {
    if (!search.trim()) { setFiltered(shifts); return }
    const q = search.toLowerCase()
    setFiltered(shifts.filter(s =>
      s.job_title?.toLowerCase().includes(q) ||
      s.title?.toLowerCase().includes(q)
    ))
  }, [search, shifts])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleRegister = async (shiftId: string) => {
    setActionLoading(shiftId)
    try {
      await registerShift(shiftId)
      showMessage('success', 'Đăng ký thành công! Chờ duyệt từ nhà tuyển dụng.')
      fetchShifts()
    } catch (err: any) {
      const code = err.response?.data?.error
      if (code === 'ALREADY_REGISTERED') showMessage('error', 'Bạn đã đăng ký ca này rồi.')
      else if (code === 'SHIFT_FULL') showMessage('error', 'Ca làm đã đầy chỗ.')
      else if (code === 'FORBIDDEN') showMessage('error', 'Bạn không có quyền đăng ký ca này.')
      else showMessage('error', 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (shiftId: string) => {
    setActionLoading(shiftId)
    try {
      await cancelRegistration(shiftId)
      showMessage('success', 'Đã hủy đăng ký.')
      fetchShifts()
    } catch (err: any) {
      showMessage('error', 'Hủy đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Tìm ca làm việc</h1>
          <p className="text-slate-400 mt-1">{filtered.length} ca đang mở</p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên việc làm..."
            className="w-full md:w-80 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {loading ? (
            <p className="text-slate-400 text-center py-12">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <Card glass>
              <p className="text-slate-400 text-center py-8">
                {search ? 'Không tìm thấy ca phù hợp.' : 'Hiện chưa có ca làm nào đang mở.'}
              </p>
            </Card>
          ) : (
            filtered.map((shift, i) => {
              const shiftStatus = shift.status as string
              const approvedCount = shift.current_workers  // now correctly = approved count
              const slotsLeft = Math.max(0, shift.max_workers - approvedCount)
              const regStatus: string | null = shift.my_registration_status ?? null
              const isPending = regStatus === 'pending'
              const isApproved = regStatus === 'approved'
              const isRejected = regStatus === 'rejected'
              const hasRegistration = isPending || isApproved || isRejected
              const isActing = actionLoading === shift.id
              const isOngoing = shiftStatus === 'ongoing'
              const isCompleted = shiftStatus === 'completed' || shiftStatus === 'cancelled'

              const SHIFT_STATUS_BADGE: Record<string, string> = {
                open: 'bg-emerald-100 text-emerald-700',
                full: 'bg-orange-100 text-orange-700',
                ongoing: 'bg-indigo-100 text-indigo-700',
                completed: 'bg-slate-100 text-slate-500',
                cancelled: 'bg-red-100 text-red-500',
              }
              const SHIFT_STATUS_LABEL: Record<string, string> = {
                open: 'Đang mở', full: 'Đã đủ chỗ', ongoing: 'Đang diễn ra',
                completed: 'Đã kết thúc', cancelled: 'Đã huỷ',
              }

              return (
                <motion.div key={shift.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card glass className="!p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900">{shift.job_title || 'Việc làm'}</h3>
                          {shift.title && <span className="text-slate-500 text-sm">— {shift.title}</span>}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${SHIFT_STATUS_BADGE[shiftStatus] || 'bg-slate-100 text-slate-500'}`}>
                            {SHIFT_STATUS_LABEL[shiftStatus] || shiftStatus}
                          </span>
                          {isPending && <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">⏳ Chờ duyệt</span>}
                          {isApproved && <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">✓ Đã duyệt</span>}
                          {isRejected && <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-600">✗ Bị từ chối</span>}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                          {formatDateTime(shift.start_time)} → {formatDateTime(shift.end_time)}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {shift.hourly_rate
                            ? <span className="text-emerald-600 font-semibold">{parseFloat(shift.hourly_rate).toLocaleString('vi-VN')}đ/giờ · </span>
                            : null}
                          {isApproved || isPending
                            ? <span className="text-slate-400">Chỗ trống: {slotsLeft}/{shift.max_workers}</span>
                            : <span>Chỗ trống: {slotsLeft}/{shift.max_workers}</span>
                          }
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isApproved ? (
                          <span className="text-xs font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg">Đã được xếp lịch</span>
                        ) : isPending ? (
                          <Button variant="ghost" size="sm" disabled={isActing}
                            onClick={() => handleCancel(shift.id)}
                            className="border border-slate-300 text-slate-500 hover:text-red-500 hover:border-red-400">
                            {isActing ? '...' : 'Hủy đăng ký'}
                          </Button>
                        ) : isRejected ? (
                          <Button variant="secondary" size="sm" disabled={isActing}
                            onClick={() => handleRegister(shift.id)}>
                            {isActing ? '...' : 'Đăng ký lại'}
                          </Button>
                        ) : isCompleted ? (
                          <span className="text-xs text-slate-400">Đã kết thúc</span>
                        ) : (
                          <Button variant="primary" size="sm" disabled={isActing}
                            onClick={() => handleRegister(shift.id)}>
                            {isActing ? '...' : 'Đăng ký'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default BrowseShiftsPage
