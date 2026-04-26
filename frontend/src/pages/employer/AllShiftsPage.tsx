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
  open: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  full: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  ongoing: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20',
  completed: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20',
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
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Ca làm việc</h1>
            <p className="text-slate-500 text-sm mt-0.5">{shifts.length} ca</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'open', 'full', 'ongoing', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${statusFilter === s ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-sm' : 'bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.10]'}`}>
                {s === '' ? 'Tất cả' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {loading ? (
            <p className="text-slate-500 text-center py-12">Đang tải...</p>
          ) : shifts.length === 0 ? (
            <Card className="p-8"><p className="text-slate-500 text-center">Không có ca làm nào.</p></Card>
          ) : (
            shifts.map((shift, i) => (
              <motion.div key={shift.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-100">{shift.title || (shift as any).job_title || 'Ca làm việc'}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[shift.status]}`}>
                          {STATUS_LABELS[shift.status]}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">
                        {(shift as any).job_title && <span className="text-cyan-400/80 font-medium">{(shift as any).job_title} · </span>}
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
