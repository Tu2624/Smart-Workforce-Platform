import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { checkIn, checkOut, getMyAttendance } from '../../api/attendance'
import { getShifts } from '../../api/shifts'

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-emerald-100 text-emerald-700', late: 'bg-amber-100 text-amber-700',
  absent: 'bg-red-100 text-red-600', incomplete: 'bg-slate-100 text-slate-500', pending: 'bg-slate-100 text-slate-400',
}
const STATUS_LABELS: Record<string, string> = {
  on_time: 'Đúng giờ', late: 'Trễ', absent: 'Vắng mặt', incomplete: 'Chưa checkout', pending: 'Chờ điểm danh',
}

const StudentAttendance: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [currentAttend, setCurrentAttend] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  const now = new Date()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [shiftsData, attendData] = await Promise.all([
        getShifts({ limit: 50 }),
        getMyAttendance({ limit: 20 }),
      ])

      // Find current active shift (student has approved registration and shift is ongoing now)
      const activeShift = (shiftsData.shifts || []).find((s: any) => {
        const start = new Date(s.start_time)
        const end = new Date(s.end_time)
        return now >= start && now <= end && s.my_registration_status === 'approved'
      })
      setCurrentShift(activeShift || null)

      // Check if already checked in for current shift
      if (activeShift) {
        const att = (attendData.attendance || []).find((a: any) => a.shift_id === activeShift.id)
        setCurrentAttend(att || null)
      }

      setHistory(attendData.attendance || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

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
          <h1 className="text-3xl font-black text-white tracking-tight">Điểm danh</h1>
          <p className="text-slate-400 mt-1">Ghi nhận giờ vào/ra ca làm của bạn</p>
        </motion.div>

        {/* Current shift check-in/out */}
        <motion.div variants={itemVariants}>
          <Card glass>
            {loading ? (
              <p className="text-slate-400 text-center py-6">Đang tải...</p>
            ) : !currentShift ? (
              <div className="text-center py-8">
                <p className="text-slate-500 font-semibold">Không có ca làm nào đang diễn ra</p>
                <p className="text-slate-600 text-sm mt-1">Ca làm sẽ xuất hiện ở đây khi bạn có lịch</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Ca đang diễn ra</p>
                  <h2 className="text-xl font-black text-slate-900">{currentShift.job_title || 'Ca làm việc'}</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {new Date(currentShift.start_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                    {' — '}
                    {new Date(currentShift.end_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                  </p>
                </div>

                {message && (
                  <p className={`text-sm font-bold ${message.startsWith('✓') ? 'text-emerald-600' : message.startsWith('⚠') ? 'text-amber-600' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}

                {!currentAttend ? (
                  <Button variant="primary" isLoading={actionLoading} onClick={handleCheckIn}
                    className="w-full max-w-xs mx-auto text-lg py-4">
                    CHECK IN
                  </Button>
                ) : !currentAttend.check_out_time ? (
                  <div className="space-y-2">
                    <p className="text-emerald-600 font-bold text-sm">
                      ✓ Đã check-in lúc {new Date(currentAttend.check_in_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                      {currentAttend.late_minutes > 0 && ` (trễ ${currentAttend.late_minutes} phút)`}
                    </p>
                    <Button variant="secondary" isLoading={actionLoading} onClick={handleCheckOut}
                      className="w-full max-w-xs mx-auto text-lg py-4">
                      CHECK OUT
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-600 font-bold">
                    ✓ Đã checkout lúc {new Date(currentAttend.check_out_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* History */}
        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">Lịch sử điểm danh</h2>
            {history.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Chưa có lịch sử điểm danh.</p>
            ) : (
              <div className="space-y-3">
                {history.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{a.job_title || a.shift_title || 'Ca làm việc'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.start_time).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}
                        {a.hours_worked != null && ` · ${Number(a.hours_worked).toFixed(1)}h`}
                        {a.late_minutes > 0 && ` · Trễ ${a.late_minutes}p`}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[a.status]}`}>
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
