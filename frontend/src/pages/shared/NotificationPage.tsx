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
            <h1 className="text-3xl font-black text-white tracking-tight">Thông báo</h1>
            {unreadCount > 0 && <p className="text-slate-400 mt-1">{unreadCount} chưa đọc</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>Đọc tất cả</Button>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-center py-12">Không có thông báo nào.</p>
            ) : (
              <div className="space-y-1">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-4 rounded-xl transition-colors cursor-pointer
                      ${!n.is_read ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-50/50'}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                      {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
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
