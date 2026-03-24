import { query } from '../../config/database'
import { createError } from '../../middleware/errorHandler'
import { hasConflict } from '../../utils/conflictCheck'
import { notifyUser } from '../../config/socket'
import { z } from 'zod'
import { createShiftSchema, updateShiftSchema, reviewRegistrationSchema } from './shift.schema'

type CreateShiftInput = z.infer<typeof createShiftSchema>
type UpdateShiftInput = z.infer<typeof updateShiftSchema>
type ReviewInput = z.infer<typeof reviewRegistrationSchema>

export async function createShift(employerId: string, input: CreateShiftInput) {
  const result = await query(
    `INSERT INTO shifts (job_id, employer_id, title, start_time, end_time, max_workers, auto_assign)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [input.job_id, employerId, input.title ?? null, input.start_time, input.end_time, input.max_workers, input.auto_assign],
  )
  return result.rows[0]
}

export async function listShifts(role: string, userId: string, filters: Record<string, string> = {}) {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (role === 'employer') {
    conditions.push(`s.employer_id = $${idx++}`)
    values.push(userId)
  } else {
    conditions.push(`s.status = 'open'`)
  }
  if (filters.job_id) { conditions.push(`s.job_id = $${idx++}`); values.push(filters.job_id) }
  if (filters.date) { conditions.push(`DATE(s.start_time) = $${idx++}`); values.push(filters.date) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await query(`SELECT s.*, j.title as job_title, j.hourly_rate FROM shifts s JOIN jobs j ON s.job_id = j.id ${where} ORDER BY s.start_time`, values)
  return result.rows
}

export async function getShiftById(id: string) {
  const result = await query(`SELECT s.*, j.title as job_title, j.hourly_rate FROM shifts s JOIN jobs j ON s.job_id = j.id WHERE s.id = $1`, [id])
  if (!result.rowCount || result.rowCount === 0) throw createError('Shift not found', 404, 'NOT_FOUND')
  return result.rows[0]
}

export async function updateShift(id: string, employerId: string, input: UpdateShiftInput) {
  const shift = await getShiftById(id)
  if (shift.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')
  if (shift.status !== 'open') throw createError('Cannot edit non-open shift', 400, 'INVALID_STATE')

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (input.title !== undefined) { fields.push(`title = $${idx++}`); values.push(input.title) }
  if (input.start_time !== undefined) { fields.push(`start_time = $${idx++}`); values.push(input.start_time) }
  if (input.end_time !== undefined) { fields.push(`end_time = $${idx++}`); values.push(input.end_time) }
  if (input.max_workers !== undefined) { fields.push(`max_workers = $${idx++}`); values.push(input.max_workers) }

  if (fields.length === 0) return shift
  values.push(id)
  const result = await query(`UPDATE shifts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values)
  return result.rows[0]
}

export async function deleteShift(id: string, employerId: string) {
  const shift = await getShiftById(id)
  if (shift.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')
  await query(`UPDATE shifts SET status = 'cancelled' WHERE id = $1`, [id])
}

export async function registerShift(shiftId: string, studentId: string) {
  const shift = await getShiftById(shiftId)
  if (shift.status !== 'open') throw createError('Shift is not open for registration', 400, 'SHIFT_NOT_OPEN')
  if (shift.current_workers >= shift.max_workers) throw createError('Shift is full', 409, 'SHIFT_FULL')

  const existing = await query(
    `SELECT sr.shift_id, s.start_time, s.end_time FROM shift_registrations sr
     JOIN shifts s ON sr.shift_id = s.id
     WHERE sr.student_id = $1 AND sr.status IN ('pending','approved')`,
    [studentId],
  )
  if (hasConflict({ start_time: shift.start_time, end_time: shift.end_time }, existing.rows)) {
    throw createError('Shift conflicts with existing registration', 409, 'SHIFT_CONFLICT')
  }

  const result = await query(
    `INSERT INTO shift_registrations (shift_id, student_id) VALUES ($1, $2)
     ON CONFLICT (shift_id, student_id) DO NOTHING RETURNING *`,
    [shiftId, studentId],
  )
  if (!result.rowCount || result.rowCount === 0) throw createError('Already registered', 409, 'ALREADY_REGISTERED')

  notifyUser(shift.employer_id, 'shift:registered', { shift_id: shiftId, student_id: studentId })
  return result.rows[0]
}

export async function getRegistrations(shiftId: string, employerId: string) {
  const shift = await getShiftById(shiftId)
  if (shift.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')
  const result = await query(
    `SELECT sr.*, u.full_name, u.email, sp.reputation_score FROM shift_registrations sr
     JOIN users u ON sr.student_id = u.id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE sr.shift_id = $1 ORDER BY sr.registered_at`,
    [shiftId],
  )
  return result.rows
}

export async function reviewRegistration(shiftId: string, regId: string, employerId: string, input: ReviewInput) {
  const shift = await getShiftById(shiftId)
  if (shift.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')

  const result = await query(
    `UPDATE shift_registrations SET status = $1, reviewed_at = NOW(), reviewed_by = $2
     WHERE id = $3 AND shift_id = $4 RETURNING *`,
    [input.status, employerId, regId, shiftId],
  )
  if (!result.rowCount || result.rowCount === 0) throw createError('Registration not found', 404, 'NOT_FOUND')

  const reg = result.rows[0]
  if (input.status === 'approved') {
    await query(`UPDATE shifts SET current_workers = current_workers + 1 WHERE id = $1`, [shiftId])
    notifyUser(reg.student_id, 'shift:approved', { shift_id: shiftId, registration_id: regId })
  }
  notifyUser(reg.student_id, 'notification:new', {
    type: input.status === 'approved' ? 'shift_approved' : 'shift_rejected',
    title: input.status === 'approved' ? 'Ca làm được duyệt!' : 'Ca làm bị từ chối',
    body: `Ca làm của bạn đã ${input.status === 'approved' ? 'được duyệt' : 'bị từ chối'}.`,
  })
  return reg
}

export async function cancelRegistration(shiftId: string, studentId: string) {
  const result = await query(
    `UPDATE shift_registrations SET status = 'cancelled' WHERE shift_id = $1 AND student_id = $2 AND status IN ('pending','approved') RETURNING *`,
    [shiftId, studentId],
  )
  if (!result.rowCount || result.rowCount === 0) throw createError('Registration not found', 404, 'NOT_FOUND')
}
