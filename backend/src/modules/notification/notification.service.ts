import pool from '../../config/database'

export class NotificationService {
  async listNotifications(userId: string, query: any) {
    const limit = parseInt(query.limit) || 20
    const page = parseInt(query.page) || 1
    const offset = (page - 1) * limit

    const conditions = ['user_id = ?']
    const params: any[] = [userId]

    if (query.is_read !== undefined) {
      conditions.push('is_read = ?')
      params.push(query.is_read === 'false' ? 0 : 1)
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const [rows] = await pool.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${where}`, params
    ) as any
    const [[unreadRow]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]
    ) as any

    return {
      notifications: (rows as any[]).map(n => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      unread_count: Number(unreadRow.count),
      pagination: { page, limit, total: Number(countRow.total) },
    }
  }

  async markRead(notifId: string, userId: string) {
    const [rows] = await pool.query('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [notifId, userId])
    if (!(rows as any[]).length) throw new Error('NOT_FOUND')
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId])
    return { message: 'Marked as read' }
  }

  async markAllRead(userId: string) {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId])
    return { message: 'All notifications marked as read' }
  }
}

export const notificationService = new NotificationService()
