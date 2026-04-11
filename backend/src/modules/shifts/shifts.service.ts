import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'

export class ShiftsService {
  async createShift(employerId: string, data: any) {
    const { job_id, start_time, end_time, max_workers, title, auto_assign } = data

    const [jobRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [job_id])
    const job = (jobRows as any[])[0]
    if (!job) throw new Error('JOB_NOT_FOUND')
    if (job.employer_id !== employerId) throw new Error('FORBIDDEN')

    const shiftId = uuidv4()
    await pool.query(
      'INSERT INTO shifts (id, job_id, employer_id, title, start_time, end_time, max_workers, auto_assign) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [shiftId, job_id, employerId, title ?? null, start_time, end_time, max_workers, auto_assign ? 1 : 0]
    )

    return this.getShift(shiftId, 'employer')
  }

  async listShifts(role: string, userId: string, query: any) {
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const offset = (page - 1) * limit

    const conditions: string[] = []
    const values: any[] = []

    if (role === 'employer') {
      conditions.push('s.employer_id = ?')
      values.push(userId)
      if (query.status) { conditions.push('s.status = ?'); values.push(query.status) }
    } else {
      // student: open shifts from active jobs belonging to their employer
      const [profileRows] = await pool.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId])
      const studentEmployerId = (profileRows as any[])[0]?.employer_id || null

      conditions.push("s.status = 'open'")
      conditions.push("j.status = 'active'")
      conditions.push('s.employer_id = ?')
      values.push(studentEmployerId)
    }

    if (query.job_id) { conditions.push('s.job_id = ?'); values.push(query.job_id) }
    if (query.date) {
      conditions.push('DATE(s.start_time) = ?')
      values.push(query.date)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM shifts s LEFT JOIN jobs j ON s.job_id = j.id ${where}`,
      values
    )
    const total = (countRows as any[])[0].total

    const [rows] = await pool.query(
      `SELECT s.*, j.title as job_title, j.hourly_rate, j.status as job_status
       FROM shifts s
       LEFT JOIN jobs j ON s.job_id = j.id
       ${where}
       ORDER BY s.start_time ASC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    )

    const shifts = (rows as any[]).map(s => this._parseShift(s))

    if (role === 'student' && shifts.length > 0) {
      const shiftIds = shifts.map(s => s.id)
      const [regRows] = await pool.query(
        "SELECT shift_id, status FROM shift_registrations WHERE student_id = ? AND shift_id IN (?) AND status != 'cancelled'",
        [userId, shiftIds]
      )
      const regMap = new Map((regRows as any[]).map(r => [r.shift_id, r.status]))
      return {
        shifts: shifts.map(s => ({ ...s, my_registration_status: regMap.get(s.id) ?? null })),
        pagination: { page, limit, total }
      }
    }

    return { shifts, pagination: { page, limit, total } }
  }

  async getShift(shiftId: string, role: string, userId?: string) {
    const [rows] = await pool.query(
      `SELECT s.*, j.title as job_title, j.hourly_rate, j.status as job_status, j.description as job_description
       FROM shifts s
       LEFT JOIN jobs j ON s.job_id = j.id
       WHERE s.id = ?`,
      [shiftId]
    )
    const shift = (rows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')

    if (role === 'student' && userId) {
      const [profileRows] = await pool.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId])
      const profile = (profileRows as any[])[0]
      if (!profile || profile.employer_id.toLowerCase() !== shift.employer_id.toLowerCase()) {
        throw new Error('FORBIDDEN')
      }
    }

    const parsed = this._parseShift(shift)

    if (role === 'employer') {
      const [regRows] = await pool.query(
        'SELECT COUNT(*) as count FROM shift_registrations WHERE shift_id = ?',
        [shiftId]
      )
      parsed.registrations_count = (regRows as any[])[0].count
    }

    return { shift: parsed }
  }

  async updateShift(shiftId: string, employerId: string, data: any) {
    const [rows] = await pool.query('SELECT * FROM shifts WHERE id = ?', [shiftId])
    const shift = (rows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')
    if (shift.employer_id !== employerId) throw new Error('FORBIDDEN')
    if (shift.status !== 'open') throw new Error('CANNOT_EDIT_SHIFT')

    const { title, start_time, end_time, max_workers, auto_assign } = data
    const updates: string[] = []
    const values: any[] = []

    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time) }
    if (end_time !== undefined) { updates.push('end_time = ?'); values.push(end_time) }
    if (max_workers !== undefined) { updates.push('max_workers = ?'); values.push(max_workers) }
    if (auto_assign !== undefined) { updates.push('auto_assign = ?'); values.push(auto_assign ? 1 : 0) }

    if (updates.length === 0) return this.getShift(shiftId, 'employer')

    values.push(shiftId)
    await pool.query(`UPDATE shifts SET ${updates.join(', ')} WHERE id = ?`, values)
    return this.getShift(shiftId, 'employer')
  }

  async deleteShift(shiftId: string, employerId: string) {
    const [rows] = await pool.query('SELECT * FROM shifts WHERE id = ?', [shiftId])
    const shift = (rows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')
    if (shift.employer_id !== employerId) throw new Error('FORBIDDEN')

    const connection = await pool.getConnection()
    await connection.beginTransaction()
    try {
      await connection.query(
        "UPDATE shift_registrations SET status = 'cancelled' WHERE shift_id = ? AND status IN ('pending', 'approved')",
        [shiftId]
      )
      await connection.query("UPDATE shifts SET status = 'cancelled' WHERE id = ?", [shiftId])
      await connection.commit()
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }

    return { message: 'Shift cancelled successfully' }
  }

  async registerShift(shiftId: string, studentId: string) {
    const [shiftRows] = await pool.query('SELECT * FROM shifts WHERE id = ?', [shiftId])
    const shift = (shiftRows as any[])[0]
    if (!shift) throw new Error('SHIFT_NOT_FOUND')
    if (shift.status !== 'open') throw new Error('SHIFT_NOT_OPEN')

    const [profileRows] = await pool.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [studentId])
    const profile = (profileRows as any[])[0]
    if (!profile || profile.employer_id.toLowerCase() !== shift.employer_id.toLowerCase()) throw new Error('FORBIDDEN')

    if (shift.current_workers >= shift.max_workers) throw new Error('SHIFT_FULL')

    const regId = uuidv4()
    try {
      await pool.query(
        "INSERT INTO shift_registrations (id, shift_id, student_id, status) VALUES (?, ?, ?, 'pending')",
        [regId, shiftId, studentId]
      )
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') throw new Error('ALREADY_REGISTERED')
      throw err
    }

    return { message: 'Registration submitted successfully' }
  }

  async cancelRegistration(shiftId: string, studentId: string) {
    const [rows] = await pool.query(
      "SELECT * FROM shift_registrations WHERE shift_id = ? AND student_id = ? AND status = 'pending'",
      [shiftId, studentId]
    )
    const reg = (rows as any[])[0]
    if (!reg) throw new Error('REGISTRATION_NOT_FOUND')

    await pool.query("UPDATE shift_registrations SET status = 'cancelled' WHERE id = ?", [reg.id])
    return { message: 'Registration cancelled successfully' }
  }

  private _parseShift(shift: any) {
    return {
      ...shift,
      auto_assign: Boolean(shift.auto_assign),
      hourly_rate: shift.hourly_rate ? parseFloat(shift.hourly_rate) : null,
      job: shift.job_title ? {
        id: shift.job_id,
        title: shift.job_title,
        hourly_rate: shift.hourly_rate ? parseFloat(shift.hourly_rate) : null,
        status: shift.job_status,
        description: shift.job_description,
      } : undefined,
    }
  }
}

export const shiftsService = new ShiftsService()
