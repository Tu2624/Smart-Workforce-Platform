import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { checkIn, checkOut, getMyAttendance } from '../../api/attendance'
import { getShifts } from '../../api/shifts'
import { getServerTime } from '../../api/devTime'

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  late: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  absent: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  incomplete: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
  pending: 'bg-slate-500/10 text-slate-500 ring-1 ring-inset ring-slate-600/20',
}
const STATUS_LABELS: Record<string, string> = {
  on_time: 'Đúng giờ', late: 'Trễ', absent: 'Vắng mặt', incomplete: 'Chưa checkout', pending: 'Chờ điểm danh',
}

const StudentAttendance: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [currentAttend, setCurrentAttend] = useState<any>(null)
  const [upcomingShifts, setUpcomingShifts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [shiftsData, attendData, timeData] = await Promise.all([
        getShifts({ limit: 100 }),
        getMyAttendance({ limit: 20 }),
        getServerTime().catch(() => ({ server_time: new Date().toISOString() }))
      ])

      const now = new Date(timeData.server_time)
      const nowMs = now.getTime()
      
      const myShifts = (shiftsData.shifts || [])
        .filter((s: any) => s.my_registration_status === 'approved')
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      const attendMap = new Map((attendData.attendance || []).map((a: any) => [a.shift_id, a]))

      // Active = the earliest approved shift that is within the (now <= end+2h) window
      const active = myShifts.find((s: any) => {
        const att = attendMap.get(s.id) as any
        if (att?.check_out_time) return false // Already finished
        
        const endTime = new Date(s.end_time).getTime()
        const endWithGrace = endTime + 2 * 3600 * 1000
        
        // Always show the next upcoming shift as active (no start-time restriction)
        return nowMs <= endWithGrace
      })
      
      setCurrentShift(active || null)
      setCurrentAttend(active ? (attendMap.get(active.id) || null) : null)

      // Upcoming = approved shifts that are not the 'active' one
      setUpcomingShifts(myShifts.filter((s: any) => {
        if (active && s.id === active.id) return false
        const startTime = new Date(s.start_time).getTime()
        return startTime > nowMs
      }))

      setHistory(attendData.attendance || [])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
    // Refresh when tab becomes visible
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const handleCheckIn = async () => {
    if (!currentShift) return
    setActionLoading(true); setMessage('')
    try {
      const res = await checkIn(currentShift.id)
      setMessage(res.attendance.status === 'on_time' ? '✓ Điểm danh đúng giờ!' : `⚠ Trễ ${res.attendance.late_minutes} phút`)
      fetchData()
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Điểm danh thất bại.')
    } finally { setActionLoading(false) }
  }

  const handleCheckOut = async () => {
    if (!currentShift) return
    setActionLoading(true); setMessage('')
    try {
      await checkOut(currentShift.id)
      setMessage('✓ Checkout thành công!')
      fetchData()
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Checkout thất bại.')
    } finally { setActionLoading(false) }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Điểm danh</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ghi nhận giờ vào/ra ca làm của bạn</p>
        </motion.div>

        {/* Current shift check-in/out */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/[0.12] to-blue-500/[0.08] border border-cyan-500/20 p-6">
            {loading ? (
              <p className="text-slate-500 text-center py-6">Đang tải...</p>
            ) : !currentShift ? (
              <div className="text-center py-8">
                <p className="text-slate-400 font-medium">Không có ca làm nào đang diễn ra</p>
                <p className="text-slate-600 text-sm mt-1">Ca làm sẽ xuất hiện ở đây khi bạn có lịch</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-cyan-400/80 uppercase tracking-widest mb-2">Ca đang diễn ra</p>
                  <h2 className="text-xl font-display font-bold text-white">{currentShift.job_title || 'Ca làm việc'}</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {new Date(currentShift.start_time).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}
                    <br />
                    {new Date(currentShift.start_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                    {' — '}
                    {new Date(currentShift.end_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                  </p>
                </div>

                <div className="flex justify-center">
                  <button onClick={fetchData} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold">
                    ⟳ Làm mới dữ liệu
                  </button>
                </div>

                {message && (
                  <p className={`text-sm font-semibold ${message.startsWith('✓') ? 'text-emerald-400' : message.startsWith('⚠') ? 'text-amber-400' : 'text-red-400'}`}>
                    {message}
                  </p>
                )}

                {!currentAttend ? (
                  <Button variant="primary" size="lg" isLoading={actionLoading} onClick={handleCheckIn}
                    className="w-full max-w-xs mx-auto">
                    CHECK IN
                  </Button>
                ) : !currentAttend.check_out_time ? (
                  <div className="space-y-3">
                    <p className="text-emerald-400 font-semibold text-sm">
                      Đã check-in lúc {new Date(currentAttend.check_in_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                      {currentAttend.late_minutes > 0 && ` (trễ ${currentAttend.late_minutes} phút)`}
                    </p>
                    <Button variant="danger" size="lg" isLoading={actionLoading} onClick={handleCheckOut}
                      className="w-full max-w-xs mx-auto">
                      CHECK OUT
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-400 font-semibold">
                    Đã checkout lúc {new Date(currentAttend.check_out_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming approved shifts */}
        {upcomingShifts.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-5">
              <h2 className="text-sm font-display font-semibold text-slate-200 mb-3">Ca làm sắp tới ({upcomingShifts.length})</h2>
              <div>
                {upcomingShifts.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-0">
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{s.job_title || s.title || 'Ca làm việc'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(s.start_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        {' → '}
                        {new Date(s.end_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20">Đã duyệt</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* History */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">Lịch sử điểm danh</h2>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Chưa có lịch sử điểm danh.</p>
            ) : (
              <div>
                {history.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{a.job_title || a.shift_title || 'Ca làm việc'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.start_time).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}
                        {a.hours_worked != null && ` · ${Number(a.hours_worked).toFixed(1)}h`}
                        {a.late_minutes > 0 && ` · Trễ ${a.late_minutes}p`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default StudentAttendance
