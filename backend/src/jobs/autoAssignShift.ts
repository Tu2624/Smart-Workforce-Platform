import { query } from '../config/database'
import { hasConflict } from '../utils/conflictCheck'
import { notifyUser } from '../config/socket'

export async function autoAssignShift(shiftId: string): Promise<void> {
  const shiftResult = await query(
    `SELECT s.*, j.required_skills FROM shifts s JOIN jobs j ON s.job_id = j.id WHERE s.id = $1`,
    [shiftId],
  )
  const shift = shiftResult.rows[0]
  if (!shift) return

  const slotsNeeded = shift.max_workers - shift.current_workers
  if (slotsNeeded <= 0) return

  // Get eligible students sorted by reputation
  const studentsResult = await query(
    `SELECT u.id, sp.reputation_score FROM users u
     JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.role = 'student' AND u.is_active = true AND sp.reputation_score >= 50
     ORDER BY sp.reputation_score DESC`,
  )

  let assigned = 0
  for (const student of studentsResult.rows) {
    if (assigned >= slotsNeeded) break

    // Check conflict
    const existingResult = await query(
      `SELECT s.start_time, s.end_time FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       WHERE sr.student_id = $1 AND sr.status IN ('pending','approved')`,
      [student.id],
    )
    if (hasConflict({ start_time: shift.start_time, end_time: shift.end_time }, existingResult.rows)) continue

    // Auto assign
    try {
      await query(
        `INSERT INTO shift_registrations (shift_id, student_id, status, reviewed_at)
         VALUES ($1, $2, 'approved', NOW())
         ON CONFLICT (shift_id, student_id) DO NOTHING`,
        [shiftId, student.id],
      )
      await query(`UPDATE shifts SET current_workers = current_workers + 1 WHERE id = $1`, [shiftId])
      await query(
        `INSERT INTO notifications (user_id, type, title, body, metadata) VALUES ($1, 'shift_auto_assigned', 'Ca làm mới!', 'Bạn đã được tự động xếp vào một ca làm.', $2)`,
        [student.id, JSON.stringify({ shift_id: shiftId })],
      )
      try {
        notifyUser(student.id, 'shift:approved', { shift_id: shiftId })
      } catch { /* socket may not be ready */ }
      assigned++
    } catch { /* conflict race, skip */ }
  }
}
