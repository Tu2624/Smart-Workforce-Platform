import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'
import { calcPayrollItem } from '../../utils/payrollCalc'
import { createNotification } from '../../utils/notificationHelper'

// Called after each checkout (or force-complete) to create/update payroll_item and payroll summary
export async function calcPayroll(attendanceId: string) {
  const [rows] = await pool.query(
    `SELECT a.*, s.start_time, s.end_time, s.employer_id, j.hourly_rate
     FROM attendance a
     JOIN shifts s ON a.shift_id = s.id
     LEFT JOIN jobs j ON s.job_id = j.id
     WHERE a.id = ?`,
    [attendanceId]
  )
  const att = (rows as any[])[0]
  if (!att || !att.check_out_time) return

  // Avoid duplicate payroll_item
  const [existing] = await pool.query('SELECT id FROM payroll_items WHERE attendance_id = ?', [attendanceId])
  if ((existing as any[]).length) return

  const shiftDurationHours =
    (new Date(att.end_time).getTime() - new Date(att.start_time).getTime()) / 3600000
  const isIncomplete = att.status === 'incomplete'

  const item = calcPayrollItem({
    shiftDurationHours,
    hourlyRate: parseFloat(att.hourly_rate) || 0,
    lateMinutes: att.late_minutes || 0,
    earlyMinutes: att.early_minutes || 0,
    isIncomplete,
  })

  // Find or create monthly payroll record
  const periodStart = new Date(att.start_time)
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0)

  const periodStartStr = periodStart.toISOString().slice(0, 10)
  const periodEndStr = periodEnd.toISOString().slice(0, 10)

  let [[payrollRow]] = await pool.query(
    'SELECT * FROM payroll WHERE student_id = ? AND employer_id = ? AND period_start = ?',
    [att.student_id, att.employer_id, periodStartStr]
  ) as any

  if (!payrollRow) {
    const payrollId = uuidv4()
    await pool.query(
      `INSERT INTO payroll (id, student_id, employer_id, period_start, period_end, total_hours, total_amount)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [payrollId, att.student_id, att.employer_id, periodStartStr, periodEndStr]
    )
    ;[[payrollRow]] = await pool.query('SELECT * FROM payroll WHERE id = ?', [payrollId]) as any
  }

  // Create payroll_item
  const itemId = uuidv4()
  await pool.query(
    `INSERT INTO payroll_items (id, payroll_id, shift_id, attendance_id, scheduled_hours, hours_worked, hourly_rate, deduction_minutes, deduction_amount, subtotal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [itemId, payrollRow.id, att.shift_id, attendanceId, item.scheduled_hours, item.hours_worked,
     parseFloat(att.hourly_rate) || 0, item.deduction_minutes, item.deduction_amount, item.subtotal]
  )

  // Update payroll totals
  await pool.query(
    `UPDATE payroll
     SET total_hours = total_hours + ?, total_amount = total_amount + ?
     WHERE id = ?`,
    [item.hours_worked, item.subtotal, payrollRow.id]
  )

  await createNotification(
    att.student_id,
    'payroll_updated',
    'Thu nhập đã được cập nhật',
    `Ca làm của bạn đã được tính lương: ${item.subtotal.toLocaleString('vi-VN')}đ`,
    { payroll_id: payrollRow.id, shift_id: att.shift_id }
  )
}

export class PayrollService {
  async listStudentPayroll(studentId: string, query: any) {
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 12
    const offset = (page - 1) * limit

    const conditions = ['p.student_id = ?']
    const params: any[] = [studentId]
    if (query.status) { conditions.push('p.status = ?'); params.push(query.status) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const [rows] = await pool.query(
      `SELECT p.*, u.full_name as employer_name, ep.company_name
       FROM payroll p
       JOIN users u ON p.employer_id = u.id
       LEFT JOIN employer_profiles ep ON ep.user_id = p.employer_id
       ${where} ORDER BY p.period_start DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[countRow]] = await pool.query(`SELECT COUNT(*) as total FROM payroll p ${where}`, params) as any
    return {
      payroll: (rows as any[]).map(r => ({ ...r, total_hours: parseFloat(r.total_hours), total_amount: parseFloat(r.total_amount) })),
      pagination: { page, limit, total: Number(countRow.total) },
    }
  }

  async getPayrollDetail(payrollId: string, userId: string, role: string) {
    const [rows] = await pool.query('SELECT * FROM payroll WHERE id = ?', [payrollId])
    const payroll = (rows as any[])[0]
    if (!payroll) throw new Error('NOT_FOUND')
    if (role === 'student' && payroll.student_id !== userId) throw new Error('FORBIDDEN')
    if (role === 'employer' && payroll.employer_id !== userId) throw new Error('FORBIDDEN')

    const [items] = await pool.query(
      `SELECT pi.*, s.title as shift_title, s.start_time, s.end_time
       FROM payroll_items pi
       LEFT JOIN shifts s ON pi.shift_id = s.id
       WHERE pi.payroll_id = ? ORDER BY s.start_time ASC`,
      [payrollId]
    )
    return {
      payroll: {
        ...payroll,
        total_hours: parseFloat(payroll.total_hours),
        total_amount: parseFloat(payroll.total_amount),
        items: (items as any[]).map(i => ({
          ...i,
          scheduled_hours: parseFloat(i.scheduled_hours),
          hours_worked: parseFloat(i.hours_worked),
          hourly_rate: parseFloat(i.hourly_rate),
          deduction_amount: parseFloat(i.deduction_amount),
          subtotal: parseFloat(i.subtotal),
        })),
      },
    }
  }

  async listEmployerPayroll(employerId: string, query: any) {
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const offset = (page - 1) * limit

    const conditions = ['p.employer_id = ?']
    const params: any[] = [employerId]
    if (query.status) { conditions.push('p.status = ?'); params.push(query.status) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const [rows] = await pool.query(
      `SELECT p.*, u.full_name as student_name
       FROM payroll p JOIN users u ON p.student_id = u.id
       ${where} ORDER BY p.period_start DESC, u.full_name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[countRow]] = await pool.query(`SELECT COUNT(*) as total FROM payroll p ${where}`, params) as any
    return {
      payroll: (rows as any[]).map(r => ({ ...r, total_hours: parseFloat(r.total_hours), total_amount: parseFloat(r.total_amount) })),
      pagination: { page, limit, total: Number(countRow.total) },
    }
  }

  async updateStatus(payrollId: string, employerId: string, newStatus: 'confirmed' | 'paid') {
    const [rows] = await pool.query('SELECT * FROM payroll WHERE id = ?', [payrollId])
    const payroll = (rows as any[])[0]
    if (!payroll) throw new Error('NOT_FOUND')
    if (payroll.employer_id !== employerId) throw new Error('FORBIDDEN')

    const validTransitions: Record<string, string> = { draft: 'confirmed', confirmed: 'paid' }
    if (validTransitions[payroll.status] !== newStatus) throw new Error('INVALID_TRANSITION')

    const paidAt = newStatus === 'paid' ? new Date() : null
    await pool.query('UPDATE payroll SET status = ?, paid_at = ? WHERE id = ?', [newStatus, paidAt, payrollId])

    if (newStatus === 'paid') {
      await createNotification(
        payroll.student_id,
        'payroll_paid',
        'Lương đã được thanh toán',
        `Bảng lương tháng ${payroll.period_start.slice(0, 7)} đã được thanh toán.`,
        { payroll_id: payrollId }
      )
    }

    return { message: `Payroll ${newStatus}` }
  }
}

export const payrollService = new PayrollService()
