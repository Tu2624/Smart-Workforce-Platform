import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'
import { notifyUser } from '../config/socket'

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata?: Record<string, any>
) {
  const id = uuidv4()
  await pool.query(
    'INSERT INTO notifications (id, user_id, type, title, body, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, type, title, body, metadata ? JSON.stringify(metadata) : null]
  )
  notifyUser(userId, 'notification:new', {
    id, type, title, body, metadata: metadata ?? null, is_read: false, created_at: new Date(),
  })
}
