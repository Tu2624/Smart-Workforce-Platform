import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { useNotificationStore } from '../../store/useNotificationStore'

const NotificationPage: React.FC = () => {
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Thông báo</h1>
            {unreadCount > 0 && <p className="text-slate-500 text-sm mt-0.5">{unreadCount} chưa đọc</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>Đọc tất cả</Button>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden !p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-slate-500 text-sm">Chưa có thông báo nào.</p>
              </div>
            ) : (
              <div>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-white/[0.06] last:border-0 transition-colors cursor-pointer hover:bg-white/[0.04] ${!n.is_read ? 'bg-cyan-500/[0.04]' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${!n.is_read ? 'text-slate-100' : 'text-slate-400'}`}>{n.title}</p>
                      {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
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

export default NotificationPage
