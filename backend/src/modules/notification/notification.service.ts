import { query } from '../../config/database'

export async function getNotifications(userId: string, filters: Record<string, string> = {}) {
  const { is_read, limit = '20' } = filters
  const values: unknown[] = [userId]
  let extra = ''
  if (is_read !== undefined) { extra = ' AND is_read = $2'; values.push(is_read === 'true') }
  values.push(parseInt(limit))
  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1${extra} ORDER BY created_at DESC LIMIT $${values.length}`,
    values,
  )
  return result.rows
}

export async function markRead(id: string, userId: string) {
  await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [id, userId])
}

export async function markAllRead(userId: string) {
  await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId])
}

export async function createNotification(userId: string, type: string, title: string, body: string, metadata?: Record<string, unknown>) {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, body, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, title, body, metadata ? JSON.stringify(metadata) : null],
  )
  return result.rows[0]
}
