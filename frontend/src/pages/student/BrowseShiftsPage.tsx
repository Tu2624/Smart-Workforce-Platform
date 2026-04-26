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
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Tìm ca làm việc</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} ca đang mở</p>
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
            className="w-full md:w-80 bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {loading ? (
            <p className="text-slate-400 text-center py-12">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <Card className="p-8">
              <p className="text-slate-500 text-center">
                {search ? 'Không tìm thấy ca phù hợp.' : 'Hiện chưa có ca làm nào đang mở.'}
              </p>
            </Card>
          ) : (
            filtered.map((shift, i) => {
              const shiftStatus = shift.status as string
              const approvedCount = shift.current_workers
              const slotsLeft = Math.max(0, shift.max_workers - approvedCount)
              const regStatus: string | null = shift.my_registration_status ?? null
              const isPending = regStatus === 'pending'
              const isApproved = regStatus === 'approved'
              const isRejected = regStatus === 'rejected'
              const isActing = actionLoading === shift.id
              const isCompleted = shiftStatus === 'completed' || shiftStatus === 'cancelled'

              const SHIFT_STATUS_BADGE: Record<string, string> = {
                open: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
                full: 'bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20',
                ongoing: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
                completed: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
                cancelled: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
              }
              const SHIFT_STATUS_LABEL: Record<string, string> = {
                open: 'Đang mở', full: 'Đã đủ chỗ', ongoing: 'Đang diễn ra',
                completed: 'Đã kết thúc', cancelled: 'Đã huỷ',
              }

              return (
                <motion.div key={shift.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-100">{shift.job_title || 'Việc làm'}</h3>
                          {shift.title && <span className="text-slate-500 text-sm">— {shift.title}</span>}
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SHIFT_STATUS_BADGE[shiftStatus] || 'bg-slate-500/10 text-slate-400'}`}>
                            {SHIFT_STATUS_LABEL[shiftStatus] || shiftStatus}
                          </span>
                          {isPending && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">Chờ duyệt</span>}
                          {isApproved && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20">Đã duyệt</span>}
                          {isRejected && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">Bị từ chối</span>}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                          {formatDateTime(shift.start_time)} → {formatDateTime(shift.end_time)}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {shift.hourly_rate
                            ? <span className="text-cyan-400 font-semibold">{parseFloat(shift.hourly_rate).toLocaleString('vi-VN')}đ/giờ · </span>
                            : null}
                          <span>Chỗ trống: {slotsLeft}/{shift.max_workers}</span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isApproved ? (
                          <span className="text-xs font-semibold text-cyan-400 px-3 py-1.5 bg-cyan-500/10 rounded-lg ring-1 ring-inset ring-cyan-500/20">Đã xếp lịch</span>
                        ) : isPending ? (
                          <Button variant="ghost" size="sm" disabled={isActing}
                            onClick={() => handleCancel(shift.id)}>
                            {isActing ? '...' : 'Hủy đăng ký'}
                          </Button>
                        ) : isRejected ? (
                          <Button variant="secondary" size="sm" disabled={isActing}
                            onClick={() => handleRegister(shift.id)}>
                            {isActing ? '...' : 'Đăng ký lại'}
                          </Button>
                        ) : isCompleted ? (
                          <span className="text-xs text-slate-500">Đã kết thúc</span>
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
