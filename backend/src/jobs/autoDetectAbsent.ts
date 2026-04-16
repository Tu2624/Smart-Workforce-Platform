import cron from 'node-cron'
import pool from '../config/database'
import { adjustReputation } from '../utils/reputationCalc'
import { createNotification } from '../utils/notificationHelper'
import { calcPayroll } from '../modules/payroll/payroll.service'
import { v4 as uuidv4 } from 'uuid'

async function detectAbsentees() {
  // Find approved registrations for shifts that started >30 min ago with no attendance record
  const [rows] = await pool.query(
    `SELECT sr.student_id, sr.shift_id, s.start_time
     FROM shift_registrations sr
     JOIN shifts s ON sr.shift_id = s.id
     LEFT JOIN attendance a ON a.shift_id = sr.shift_id AND a.student_id = sr.student_id
     WHERE sr.status = 'approved'
       AND a.id IS NULL
       AND s.start_time <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       AND s.status NOT IN ('cancelled')`
  )

  for (const row of rows as any[]) {
    const id = uuidv4()
    await pool.query(
      "INSERT IGNORE INTO attendance (id, shift_id, student_id, status, late_minutes, hours_worked) VALUES (?, ?, ?, 'absent', 0, 0)",
      [id, row.shift_id, row.student_id]
    )
    await adjustReputation(row.student_id, 'absent', `Absent from shift ${row.shift_id}`)
    await createNotification(
      row.student_id, 'absent_detected', 'Vắng mặt không phép',
      `Bạn đã không điểm danh ca làm ngày ${new Date(row.start_time).toLocaleDateString('vi-VN')}.`,
      { shift_id: row.shift_id }
    )
    // Create zero-pay payroll item for absent attendance
    await calcPayroll(id)
  }
}

export function startAbsentDetector() {
  // Every 30 minutes
  cron.schedule('*/30 * * * *', detectAbsentees, { timezone: 'Asia/Ho_Chi_Minh' })
  console.log('[AbsentDetector] Registered (every 30 min)')
}
