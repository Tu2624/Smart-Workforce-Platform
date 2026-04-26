import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'
import { adjustReputation } from '../../utils/reputationCalc'
import { createNotification } from '../../utils/notificationHelper'
import { notifyShiftRoom } from '../../config/socket'
import { calcPayroll } from '../payroll/payroll.service'
import { getNow } from '../../utils/serverTime'

const LATE_THRESHOLD_MINUTES = 5

export class AttendanceService {
  async checkIn(studentId: string, shiftId: string) {
    // Verify approved registration
    const [regRows] = await pool.query(
      "SELECT * FROM shift_registrations WHERE shift_id = ? AND student_id = ? AND status = 'approved'",
      [shiftId, studentId]
    )
    if (!(regRows as any[]).length) throw new Error('NOT_REGISTERED')

    // Check not already checked in
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE shift_id = ? AND student_id = ?',
      [shiftId, studentId]
    )
    if ((existing as any[]).length) throw new Error('ALREADY_CHECKED_IN')

    const [shiftRows] = await pool.query('SELECT * FROM shifts WHERE id = ?', [shiftId])
    const shift = (shiftRows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')

    const now = getNow()
    const startTime = new Date(shift.start_time)
    if (now.getTime() < startTime.getTime() - 1 * 3600 * 1000) {
      throw new Error('TOO_EARLY')
    }
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 60000))
    const isLate = lateMinutes > LATE_THRESHOLD_MINUTES
    const status = isLate ? 'late' : 'on_time'

    const id = uuidv4()
    await pool.query(
      'INSERT INTO attendance (id, shift_id, student_id, check_in_time, status, late_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, shiftId, studentId, now, status, lateMinutes]
    )

    // Reputation
    if (isLate) {
      await adjustReputation(studentId, lateMinutes > 15 ? 'late_major' : 'late_minor', `Late ${lateMinutes} min for shift ${shiftId}`)
    } else {
      await adjustReputation(studentId, 'on_time_checkin', `On-time check-in for shift ${shiftId}`)
    }

    // Notify employer via shift room
    const [userRows] = await pool.query('SELECT full_name FROM users WHERE id = ?', [studentId])
    notifyShiftRoom(shiftId, 'attendance:update', {
      shift_id: shiftId,
      student_id: studentId,
      student_name: (userRows as any[])[0]?.full_name,
      status,
      check_in_time: now,
    })

    return { attendance: { id, status, late_minutes: lateMinutes, check_in_time: now } }
  }

  async checkOut(studentId: string, shiftId: string) {
    const [rows] = await pool.query(
      "SELECT a.*, s.start_time, s.end_time, s.employer_id, j.hourly_rate FROM attendance a JOIN shifts s ON a.shift_id = s.id LEFT JOIN jobs j ON s.job_id = j.id WHERE a.shift_id = ? AND a.student_id = ? AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL",
      [shiftId, studentId]
    )
    const att = (rows as any[])[0]
    if (!att) throw new Error('ATTENDANCE_NOT_FOUND')

    const now = getNow()
    const endTime = new Date(att.end_time)
    const earlyMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 60000))

    const shiftDurationHours = (new Date(att.end_time).getTime() - new Date(att.start_time).getTime()) / 3600000
    const hoursWorked = Math.max(0, shiftDurationHours - (att.late_minutes + earlyMinutes) / 60)

    await pool.query(
      'UPDATE attendance SET check_out_time = ?, early_minutes = ?, hours_worked = ? WHERE id = ?',
      [now, earlyMinutes, hoursWorked, att.id]
    )

    await adjustReputation(studentId, 'complete_shift', `Completed shift ${shiftId}`)
    await calcPayroll(att.id)

    return { attendance: { id: att.id, check_out_time: now, early_minutes: earlyMinutes, hours_worked: hoursWorked } }
  }

  async listStudentAttendance(studentId: string, query: any) {
    const limit = parseInt(query.limit) || 20
    const page = parseInt(query.page) || 1
    const offset = (page - 1) * limit

    const conditions = ['a.student_id = ?']
    const params: any[] = [studentId]
    if (query.status) { conditions.push('a.status = ?'); params.push(query.status) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const [rows] = await pool.query(
      `SELECT a.*, s.start_time, s.end_time, s.title as shift_title, j.title as job_title, j.hourly_rate
       FROM attendance a
       JOIN shifts s ON a.shift_id = s.id
       LEFT JOIN jobs j ON s.job_id = j.id
       ${where} ORDER BY s.start_time DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[countRow]] = await pool.query(`SELECT COUNT(*) as total FROM attendance a ${where}`, params) as any

    return {
      attendance: rows,
      pagination: { page, limit, total: Number(countRow.total) },
    }
  }

  async listShiftAttendance(shiftId: string, employerId: string) {
    const [shiftRows] = await pool.query('SELECT employer_id FROM shifts WHERE id = ?', [shiftId])
    const shift = (shiftRows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')
    if (shift.employer_id !== employerId) throw new Error('FORBIDDEN')

    const [rows] = await pool.query(
      `SELECT sr.student_id, u.full_name, u.email, a.id, a.check_in_time, a.check_out_time,
              COALESCE(a.status, 'pending') as status, a.late_minutes, a.hours_worked, a.note
       FROM shift_registrations sr
       JOIN users u ON sr.student_id = u.id
       LEFT JOIN attendance a ON sr.shift_id = a.shift_id AND sr.student_id = a.student_id
       WHERE sr.shift_id = ? AND sr.status = 'approved'
       ORDER BY a.check_in_time ASC, u.full_name ASC`,
      [shiftId]
    )
    return { attendance: rows }
  }

  async forceComplete(attendanceId: string, employerId: string) {
    const [rows] = await pool.query(
      `SELECT a.*, s.end_time, s.employer_id FROM attendance a JOIN shifts s ON a.shift_id = s.id WHERE a.id = ?`,
      [attendanceId]
    )
    const att = (rows as any[])[0]
    if (!att) throw new Error('ATTENDANCE_NOT_FOUND')
    if (att.employer_id !== employerId) throw new Error('FORBIDDEN')
    if (att.check_out_time) throw new Error('ALREADY_COMPLETED')
    if (getNow() < new Date(att.end_time)) throw new Error('SHIFT_NOT_ENDED')

    // Check force-checkout limit (3/student/month)
    const now = getNow()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const [[limitRow]] = await pool.query(
      `SELECT COUNT(*) as count FROM attendance
       WHERE student_id = ? AND force_checkout = 1 AND created_at >= ?`,
      [att.student_id, monthStart]
    ) as any
    if (Number(limitRow.count) >= 3) throw new Error('FORCE_CHECKOUT_LIMIT_EXCEEDED')

    await pool.query(
      `UPDATE attendance SET check_out_time = NOW(), status = 'incomplete', hours_worked = 0,
       force_checkout = 1, force_checkout_by = ? WHERE id = ?`,
      [employerId, attendanceId]
    )

    await createNotification(
      att.student_id,
      'force_checkout',
      'Ca làm bị kết thúc bắt buộc',
      'Nhà tuyển dụng đã kết thúc ca làm của bạn. Thu nhập ca này sẽ là 0.',
      { shift_id: att.shift_id }
    )

    await calcPayroll(attendanceId)

    return { message: 'Force checkout completed' }
  }

  async updateNote(attendanceId: string, employerId: string, note: string) {
    const [rows] = await pool.query(
      `SELECT a.id, s.employer_id FROM attendance a JOIN shifts s ON a.shift_id = s.id WHERE a.id = ?`,
      [attendanceId]
    )
    const att = (rows as any[])[0]
    if (!att) throw new Error('ATTENDANCE_NOT_FOUND')
    if (att.employer_id !== employerId) throw new Error('FORBIDDEN')

    await pool.query('UPDATE attendance SET note = ? WHERE id = ?', [note, attendanceId])
    return { message: 'Note updated' }
  }
}

export const attendanceService = new AttendanceService()
