import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { getShifts } from '../../api/shifts'
import { Shift } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  full: 'bg-red-100 text-red-600',
  ongoing: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-rose-50 text-rose-400',
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Mở', full: 'Đầy', ongoing: 'Đang diễn ra', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}

const formatDateTime = (dt: string) =>
  new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

const AllShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const data = await getShifts(statusFilter ? { status: statusFilter } : undefined)
      setShifts(data.shifts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShifts() }, [statusFilter])

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Ca làm việc</h1>
            <p className="text-slate-400 mt-1">{shifts.length} ca</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'open', 'full', 'ongoing', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {s === '' ? 'Tất cả' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {loading ? (
            <p className="text-slate-400 text-center py-12">Đang tải...</p>
          ) : shifts.length === 0 ? (
            <Card glass><p className="text-slate-400 text-center py-8">Không có ca làm nào.</p></Card>
          ) : (
            shifts.map((shift, i) => (
              <motion.div key={shift.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card glass className="!p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-black text-slate-900">{shift.title || (shift as any).job_title || 'Ca làm việc'}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${STATUS_STYLES[shift.status]}`}>
                          {STATUS_LABELS[shift.status]}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">
                        {(shift as any).job_title && <span className="text-indigo-600 font-semibold">{(shift as any).job_title} · </span>}
                        {formatDateTime(shift.start_time)} → {formatDateTime(shift.end_time)}
                        {' · '}{shift.current_workers}/{shift.max_workers} người
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
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default AllShiftsPage
