import cron from 'node-cron'
import { env } from '../config/env'
import { query } from '../config/database'
import { notifyUser } from '../config/socket'

export function startSendReminders(): void {
  cron.schedule(env.cron.reminder, async () => {
    try {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const inThirtyMin = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      const result = await query(
        `SELECT sr.student_id, s.id as shift_id, s.start_time, s.title as shift_title, j.title as job_title
         FROM shift_registrations sr
         JOIN shifts s ON sr.shift_id = s.id
         JOIN jobs j ON s.job_id = j.id
         WHERE sr.status = 'approved'
           AND s.start_time > $1 AND s.start_time <= $2
           AND NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.user_id = sr.student_id AND n.type = 'shift_reminder'
               AND (n.metadata->>'shift_id') = s.id::text
               AND n.created_at > NOW() - INTERVAL '1 hour'
           )`,
        [inThirtyMin, inOneHour],
      )

      for (const row of result.rows) {
        try {
          await query(
            `INSERT INTO notifications (user_id, type, title, body, metadata) VALUES ($1, 'shift_reminder', $2, $3, $4)`,
            [row.student_id, 'Nhắc lịch làm việc', `Ca "${row.shift_title || row.job_title}" bắt đầu trong 1 giờ nữa`, JSON.stringify({ shift_id: row.shift_id })],
          )
          notifyUser(row.student_id, 'shift:reminder', { shift_id: row.shift_id, start_time: row.start_time, job_title: row.job_title })
        } catch { /* per-user error, continue */ }
      }

      if (result.rows.length > 0) {
        console.log(`[Reminders] Sent ${result.rows.length} shift reminders`)
      }
    } catch (err) {
      console.error('[Reminders] Error:', err)
    }
  })
}
