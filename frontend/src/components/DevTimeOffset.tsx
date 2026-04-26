import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getServerTime, setTimeOffset, resetTimeOffset, triggerSchedule } from '../api/devTime'

interface ServerTimeInfo {
  server_time: string
  offset_hours: number
  real_time: string
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' })

export const DevTimeOffset: React.FC = () => {
  const [open, setOpen]     = useState(false)
  const [info, setInfo]     = useState<ServerTimeInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [status, setStatus] = useState('')

  const refresh = useCallback(async () => {
    try {
      const data = await getServerTime()
      setInfo(data)
      setError('')
    } catch {
      setError('Không kết nối được server')
    }
  }, [])

  useEffect(() => {
    if (open) {
      refresh()
      const id = setInterval(refresh, 3000)
      return () => clearInterval(id)
    }
  }, [open, refresh])

  const adjust = async (deltaHours: number) => {
    setLoading(true)
    try {
      const current = info?.offset_hours ?? 0
      await setTimeOffset(current + deltaHours)
      await refresh()
    } finally { setLoading(false) }
  }

  const reset = async () => {
    setLoading(true)
    try { await resetTimeOffset(); await refresh() }
    finally { setLoading(false) }
  }

  const handleTriggerSchedule = async () => {
    setLoading(true)
    try {
      const res = await triggerSchedule()
      setStatus(res.message || 'Kích hoạt thành công')
      setTimeout(() => setStatus(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kích hoạt thất bại')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const offsetColor = !info ? 'text-slate-400'
    : info.offset_hours === 0 ? 'text-slate-400'
    : info.offset_hours > 0   ? 'text-amber-400'
    : 'text-blue-400'

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Dev: Time Offset"
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all ${
          info && info.offset_hours !== 0
            ? 'bg-amber-500 border-amber-400 text-white'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 right-0 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dev · Time Offset</span>
              {info && info.offset_hours !== 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 ${offsetColor}`}>
                  {info.offset_hours > 0 ? '+' : ''}{info.offset_hours.toFixed(2)}h
                </span>
              )}
            </div>

            {/* Time display */}
            {error ? (
              <p className="text-rose-400 text-xs">{error}</p>
            ) : info ? (
              <div className="space-y-1">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Giờ server (có offset)</p>
                  <p className={`text-sm font-mono font-bold ${offsetColor}`}>{fmt(info.server_time)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Giờ thật</p>
                  <p className="text-xs font-mono text-slate-500">{fmt(info.real_time)}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            )}

            {/* Controls */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Điều chỉnh</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '−1h',   delta: -1 },
                  { label: '−15m',  delta: -0.25 },
                  { label: '+15m',  delta: +0.25 },
                  { label: '+1h',   delta: +1 },
                ].map(({ label, delta }) => (
                  <button
                    key={label}
                    disabled={loading}
                    onClick={() => adjust(delta)}
                    className="py-1.5 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-40"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={loading}
                  onClick={() => adjust(+8)}
                  className="py-1.5 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                >
                  +8h (ngày mai)
                </button>
                <button
                  disabled={loading}
                  onClick={reset}
                  className="py-1.5 text-xs font-bold rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
                >
                  Reset
                </button>
              </div>
              <button
                disabled={loading}
                onClick={handleTriggerSchedule}
                className="w-full py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-glow-sm disabled:opacity-40"
              >
                Kích hoạt Xếp ca tự động
              </button>
              {status && <p className="text-cyan-400 text-[10px] text-center font-bold">{status}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
