import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getShifts } from '../../api/shifts'
import { getShiftAttendance, forceComplete, updateNote, manualCheckIn, manualCheckOut } from '../../api/attendance'
import { useAttendanceSocket } from '../../hooks/useAttendanceSocket'

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  late: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  absent: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  incomplete: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
  pending: 'bg-slate-500/10 text-slate-500 ring-1 ring-inset ring-slate-600/20',
}
const STATUS_LABELS: Record<string, string> = {
  on_time: 'Đúng giờ', late: 'Trễ', absent: 'Vắng', incomplete: 'Chưa checkout', pending: 'Chưa điểm danh',
}

const AttendanceOverview: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([])
  const [selectedShift, setSelectedShift] = useState('')
  const [attendance, setAttendance] = useState<any[]>([])
  const [loadingAttend, setLoadingAttend] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')

  useEffect(() => {
    getShifts({ limit: 50 }).then(d => {
      const active = (d.shifts || []).filter((s: any) => !['cancelled'].includes(s.status))
      setShifts(active)
      if (active.length > 0) setSelectedShift(active[0].id)
    }).catch(() => {})
  }, [])

  const refreshAttendance = useCallback(() => {
    if (!selectedShift) return
    getShiftAttendance(selectedShift)
      .then(d => setAttendance(d.attendance || []))
      .catch(() => {})
  }, [selectedShift])

  useEffect(() => {
    if (!selectedShift) return
    setLoadingAttend(true)
    getShiftAttendance(selectedShift)
      .then(d => setAttendance(d.attendance || []))
      .catch(() => setAttendance([]))
      .finally(() => setLoadingAttend(false))
  }, [selectedShift])

  useAttendanceSocket(selectedShift || null, refreshAttendance)

  const handleForceComplete = async (attId: string) => {
    if (!confirm('Xác nhận kết thúc ca bắt buộc? Thu nhập ca này sẽ là 0.')) return
    try {
      await forceComplete(attId)
      const d = await getShiftAttendance(selectedShift)
      setAttendance(d.attendance || [])
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thao tác thất bại.')
    }
  }

  const handleSaveNote = async (attId: string) => {
    try {
      await updateNote(attId, noteValue)
      setEditingNote(null)
      const d = await getShiftAttendance(selectedShift)
      setAttendance(d.attendance || [])
    } catch {}
  }

  const handleManualCheckIn = async (studentId: string) => {
    if (!confirm('Xác nhận điểm danh (check-in) hộ sinh viên?')) return
    try {
      await manualCheckIn(selectedShift, studentId)
      refreshAttendance()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thao tác thất bại.')
    }
  }

  const handleManualCheckOut = async (studentId: string) => {
    if (!confirm('Xác nhận checkout hộ sinh viên?')) return
    try {
      await manualCheckOut(selectedShift, studentId)
      refreshAttendance()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thao tác thất bại.')
    }
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Điểm danh nhân viên</h1>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi điểm danh theo từng ca</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Chọn ca làm</label>
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.title || s.job_title || 'Ca làm'} — {new Date(s.start_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </option>
              ))}
            </select>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-sm font-display font-semibold text-slate-200 mb-4">
              Danh sách điểm danh ({attendance.length})
            </h2>
            {loadingAttend ? (
              <p className="text-slate-500 text-center py-8">Đang tải...</p>
            ) : attendance.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Chưa có dữ liệu điểm danh cho ca này.</p>
            ) : (
              <div className="space-y-3">
                {attendance.map(a => (
                  <div key={a.id} className="border border-white/[0.08] rounded-xl p-4 space-y-2 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-slate-100">{a.full_name}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>

                    <div className="flex gap-6 text-xs text-slate-500">
                      <span>Vào: <b className="text-slate-300">{a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</b></span>
                      <span>Ra: <b className="text-slate-300">{a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</b></span>
                      {a.late_minutes > 0 && <span className="text-amber-400">Trễ {a.late_minutes}p</span>}
                      {a.hours_worked != null && <span>Giờ làm: <b className="text-slate-300">{Number(a.hours_worked).toFixed(1)}h</b></span>}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {a.status === 'pending' && (
                        <button onClick={() => handleManualCheckIn(a.student_id)}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                          Check-in hộ
                        </button>
                      )}
                      {(a.status === 'on_time' || a.status === 'late') && !a.check_out_time && (
                        <button onClick={() => handleManualCheckOut(a.student_id)}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                          Checkout hộ
                        </button>
                      )}
                      {a.status === 'incomplete' && (
                        <button onClick={() => handleForceComplete(a.id)}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors">
                          Force checkout
                        </button>
                      )}
                      {editingNote === (a.id || a.student_id) ? (
                        <div className="flex gap-2 flex-1">
                          <input value={noteValue} onChange={e => setNoteValue(e.target.value)}
                            className="flex-1 bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60"
                            placeholder="Thêm ghi chú..." />
                          <button onClick={() => handleSaveNote(a.id)} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Lưu</button>
                          <button onClick={() => setEditingNote(null)} className="text-xs text-slate-500">Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNote(a.id || a.student_id); setNoteValue(a.note || '') }}
                          className="text-xs font-semibold text-cyan-500/80 hover:text-cyan-400 transition-colors">
                          {a.note ? `Ghi chú: ${a.note}` : '+ Thêm ghi chú'}
                        </button>
                      )}
                    </div>
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

export default AttendanceOverview
