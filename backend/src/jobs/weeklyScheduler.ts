import cron from 'node-cron'
import pool from '../config/database'
import { createNotification } from '../utils/notificationHelper'
import { notifyUser } from '../config/socket'

async function runWeeklyScheduler() {
  console.log('[Scheduler] Running weekly shift assignment...')

  // Get all pending registrations for shifts starting this week
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [pendingRows] = await pool.query(
    `SELECT sr.*, sp.reputation_score, s.max_workers, s.current_workers, s.start_time, s.end_time, s.employer_id
     FROM shift_registrations sr
     JOIN shifts s ON sr.shift_id = s.id
     JOIN student_profiles sp ON sp.user_id = sr.student_id
     WHERE sr.status = 'pending' AND s.start_time BETWEEN ? AND ? AND s.status != 'cancelled'
     ORDER BY sr.shift_id, sp.reputation_score DESC, sr.registered_at ASC`,
    [now.toISOString(), weekEnd.toISOString()]
  )

  // Group by shift
  const byShift = new Map<string, any[]>()
  for (const row of pendingRows as any[]) {
    if (!byShift.has(row.shift_id)) byShift.set(row.shift_id, [])
    byShift.get(row.shift_id)!.push(row)
  }

  for (const [shiftId, regs] of byShift) {
    const shift = regs[0]
    const availableSlots = shift.max_workers - shift.current_workers
    let approved = 0
    const approvedStudentTimes: Array<{ studentId: string; start: Date; end: Date }> = []

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      for (const reg of regs) {
        if (approved >= availableSlots) {
          await connection.query(
            "UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?",
            [reg.id]
          )
          await createNotification(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối',
            `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} không được xếp do hết chỗ.`,
            { shift_id: shiftId, registration_id: reg.id })
          notifyUser(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id })
          continue
        }

        // Block students with reputation score < 50 from auto-assign
        if (reg.reputation_score < 50) {
          await connection.query(
            "UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?",
            [reg.id]
          )
          await createNotification(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối',
            `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} bị từ chối do điểm uy tín dưới 50.`,
            { shift_id: shiftId, registration_id: reg.id })
          notifyUser(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id })
          continue
        }

        // Check time conflict with already-approved shifts for this student
        const hasConflict = approvedStudentTimes.some(
          t => t.studentId === reg.student_id &&
               new Date(reg.start_time) < t.end &&
               new Date(reg.end_time) > t.start
        )

        if (hasConflict) {
          await connection.query(
            "UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?",
            [reg.id]
          )
          await createNotification(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối',
            `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} bị từ chối do trùng lịch.`,
            { shift_id: shiftId, registration_id: reg.id })
          notifyUser(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id })
          continue
        }

        await connection.query(
          "UPDATE shift_registrations SET status = 'approved', reviewed_at = NOW() WHERE id = ?",
          [reg.id]
        )
        approvedStudentTimes.push({
          studentId: reg.student_id,
          start: new Date(reg.start_time),
          end: new Date(reg.end_time),
        })
        approved++

        await createNotification(reg.student_id, 'shift_approved', 'Đăng ký ca làm được duyệt',
          `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} đã được xếp lịch.`,
          { shift_id: shiftId, registration_id: reg.id })
        notifyUser(reg.student_id, 'shift:approved', { shift_id: shiftId, registration_id: reg.id })
      }

      const newCount = shift.current_workers + approved
      const newStatus = newCount >= shift.max_workers ? 'full' : 'open'
      await connection.query(
        'UPDATE shifts SET current_workers = ?, status = ? WHERE id = ?',
        [newCount, newStatus, shiftId]
      )

      await connection.commit()
    } catch (err) {
      await connection.rollback()
      console.error(`[Scheduler] Error processing shift ${shiftId}:`, err)
    } finally {
      connection.release()
    }
  }

  console.log('[Scheduler] Weekly assignment complete.')
}

export function startWeeklyScheduler() {
  // Every Monday at 00:00
  cron.schedule('0 0 * * 1', runWeeklyScheduler, { timezone: 'Asia/Ho_Chi_Minh' })
  console.log('[Scheduler] Weekly scheduler registered (Mon 00:00 ICT)')
}
