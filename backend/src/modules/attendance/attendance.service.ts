import { query } from '../../config/database'
import { createError } from '../../middleware/errorHandler'
import { notifyShiftRoom } from '../../config/socket'

const LATE_GRACE_MINUTES = 5

export async function checkIn(studentId: string, shiftId: string) {
  const regResult = await query(
    `SELECT sr.id FROM shift_registrations sr WHERE sr.shift_id = $1 AND sr.student_id = $2 AND sr.status = 'approved'`,
    [shiftId, studentId],
  )
  if (!regResult.rowCount || regResult.rowCount === 0) {
    throw createError('Not approved for this shift', 400, 'NOT_APPROVED')
  }

  const existingResult = await query(
    `SELECT id FROM attendance WHERE shift_id = $1 AND student_id = $2 AND check_in_time IS NOT NULL`,
    [shiftId, studentId],
  )
  if (existingResult.rowCount && existingResult.rowCount > 0) {
    throw createError('Already checked in', 409, 'ALREADY_CHECKIN')
  }

  const shiftResult = await query<{ start_time: Date; employer_id: string }>(
    `SELECT start_time, employer_id FROM shifts WHERE id = $1`,
    [shiftId],
  )
  const shift = shiftResult.rows[0]
  const now = new Date()
  const lateMinutes = Math.max(0, Math.floor((now.getTime() - new Date(shift.start_time).getTime()) / 60000) - LATE_GRACE_MINUTES)
  const status = lateMinutes > 0 ? 'late' : 'on_time'

  const result = await query(
    `INSERT INTO attendance (shift_id, student_id, check_in_time, status, late_minutes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (shift_id, student_id) DO UPDATE
       SET check_in_time = EXCLUDED.check_in_time, status = EXCLUDED.status, late_minutes = EXCLUDED.late_minutes
     RETURNING *`,
    [shiftId, studentId, now.toISOString(), status, lateMinutes],
  )

  const attendance = result.rows[0]
  notifyShiftRoom(shiftId, 'attendance:update', { shift_id: shiftId, student_id: studentId, status, check_in_time: now })

  return attendance
}

export async function checkOut(studentId: string, shiftId: string) {
  const result = await query<{ id: string; check_in_time: Date }>(
    `SELECT id, check_in_time FROM attendance WHERE shift_id = $1 AND student_id = $2`,
    [shiftId, studentId],
  )
  if (!result.rowCount || result.rowCount === 0 || !result.rows[0].check_in_time) {
    throw createError('Not checked in yet', 400, 'NOT_CHECKIN')
  }

  const shiftResult = await query<{ end_time: Date }>(
    `SELECT end_time FROM shifts WHERE id = $1`,
    [shiftId],
  )
  const now = new Date()
  const checkInTime = new Date(result.rows[0].check_in_time)
  const effectiveEnd = new Date(Math.min(now.getTime(), new Date(shiftResult.rows[0].end_time).getTime()))
  const hoursWorked = parseFloat(((effectiveEnd.getTime() - checkInTime.getTime()) / 3600000).toFixed(2))

  const updated = await query(
    `UPDATE attendance SET check_out_time = $1, hours_worked = $2 WHERE id = $3 RETURNING *`,
    [now.toISOString(), hoursWorked, result.rows[0].id],
  )
  return updated.rows[0]
}

export async function getHistory(studentId: string, filters: Record<string, string> = {}) {
  const { page = '1', limit = '20', status } = filters
  const offset = (parseInt(page) - 1) * parseInt(limit)
  const values: unknown[] = [studentId]
  let idx = 2
  let extra = ''
  if (status) { extra += ` AND a.status = $${idx++}`; values.push(status) }
  values.push(parseInt(limit), offset)

  const result = await query(
    `SELECT a.*, s.title as shift_title, s.start_time, s.end_time, j.hourly_rate
     FROM attendance a JOIN shifts s ON a.shift_id = s.id JOIN jobs j ON s.job_id = j.id
     WHERE a.student_id = $1${extra} ORDER BY s.start_time DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  )
  return result.rows
}

export async function getShiftAttendance(shiftId: string, employerId: string) {
  const shiftResult = await query<{ employer_id: string }>(`SELECT employer_id FROM shifts WHERE id = $1`, [shiftId])
  if (shiftResult.rows[0]?.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')

  const result = await query(
    `SELECT a.*, u.full_name, u.email FROM attendance a JOIN users u ON a.student_id = u.id WHERE a.shift_id = $1 ORDER BY a.check_in_time`,
    [shiftId],
  )
  return result.rows
}
