import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getShifts } from '../../api/shifts'
import { getShiftAttendance, forceComplete, updateNote } from '../../api/attendance'

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-emerald-100 text-emerald-700', late: 'bg-amber-100 text-amber-700',
  absent: 'bg-red-100 text-red-600', incomplete: 'bg-slate-100 text-slate-500', pending: 'bg-slate-100 text-slate-400',
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

  useEffect(() => {
    if (!selectedShift) return
    setLoadingAttend(true)
    getShiftAttendance(selectedShift)
      .then(d => setAttendance(d.attendance || []))
      .catch(() => setAttendance([]))
      .finally(() => setLoadingAttend(false))
  }, [selectedShift])

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

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-black text-white tracking-tight">Điểm danh nhân viên</h1>
          <p className="text-slate-400 mt-1">Theo dõi điểm danh theo từng ca</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Chọn ca làm</label>
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title || s.job_title || 'Ca làm'} — {new Date(s.start_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </option>
              ))}
            </select>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <h2 className="text-lg font-black text-slate-900 mb-4">
              Danh sách điểm danh ({attendance.length})
            </h2>
            {loadingAttend ? (
              <p className="text-slate-400 text-center py-8">Đang tải...</p>
            ) : attendance.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Chưa có dữ liệu điểm danh cho ca này.</p>
            ) : (
              <div className="space-y-4">
                {attendance.map(a => (
                  <div key={a.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-black text-slate-900">{a.full_name}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>

                    <div className="flex gap-6 text-xs text-slate-500">
                      <span>Vào: <b className="text-slate-700">{a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</b></span>
                      <span>Ra: <b className="text-slate-700">{a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString('vi-VN', { timeStyle: 'short' }) : '—'}</b></span>
                      {a.late_minutes > 0 && <span className="text-amber-600">Trễ {a.late_minutes}p</span>}
                      {a.hours_worked != null && <span>Giờ làm: <b>{Number(a.hours_worked).toFixed(1)}h</b></span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status === 'incomplete' && (
                        <button onClick={() => handleForceComplete(a.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 underline">
                          Force checkout
                        </button>
                      )}
                      {editingNote === a.id ? (
                        <div className="flex gap-2 flex-1">
                          <input value={noteValue} onChange={e => setNoteValue(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            placeholder="Thêm ghi chú..." />
                          <button onClick={() => handleSaveNote(a.id)} className="text-xs font-bold text-indigo-600">Lưu</button>
                          <button onClick={() => setEditingNote(null)} className="text-xs text-slate-400">Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNote(a.id); setNoteValue(a.note || '') }}
                          className="text-xs font-bold text-indigo-500 hover:text-indigo-700">
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
