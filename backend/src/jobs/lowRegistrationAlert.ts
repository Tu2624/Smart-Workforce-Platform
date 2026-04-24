import cron from 'node-cron'
import pool from '../config/database'
import { notifyUser } from '../config/socket'
import { createNotification } from '../utils/notificationHelper'

async function runLowRegistrationAlert() {
  console.log('[LowRegAlert] Checking shifts with no approved registrations...')

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Find shifts next 7 days with 0 approved registrations
  const [rows] = await pool.query(
    `SELECT s.id, s.title, s.max_workers, s.employer_id
     FROM shifts s
     LEFT JOIN shift_registrations sr ON s.id = sr.shift_id AND sr.status = 'approved'
     WHERE s.start_time BETWEEN ? AND ?
       AND s.status NOT IN ('cancelled', 'completed')
     GROUP BY s.id
     HAVING COUNT(sr.id) = 0`,
    [now.toISOString(), weekEnd.toISOString()]
  )

  const shifts = rows as any[]
  for (const shift of shifts) {
    await createNotification(
      shift.employer_id,
      'shift_low_registration',
      'Ca làm chưa có nhân viên',
      `Ca "${shift.title}" chưa có ai đăng ký được duyệt. Còn 1 giờ trước deadline đăng ký (12:00).`,
      { shift_id: shift.id, current_count: 0, max_workers: shift.max_workers }
    )
    notifyUser(shift.employer_id, 'shift:low_registration', {
      shift_id: shift.id,
      title: shift.title,
      current_count: 0,
      max_workers: shift.max_workers,
    })
  }

  console.log(`[LowRegAlert] Alerted ${shifts.length} shift(s).`)
}

export function startLowRegAlert() {
  // Every Sunday at 11:00 AM ICT (1 hour before registration deadline noon)
  cron.schedule('0 11 * * 0', runLowRegistrationAlert, { timezone: 'Asia/Ho_Chi_Minh' })
  console.log('[LowRegAlert] Low registration alert registered (Sun 11:00 ICT)')
}
