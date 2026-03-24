import { query } from '../../config/database'
import { createError } from '../../middleware/errorHandler'
import { calculatePay } from '../../utils/payrollCalc'
import { notifyUser } from '../../config/socket'

export async function getStudentPayroll(studentId: string, filters: Record<string, string> = {}) {
  const result = await query(
    `SELECT p.*, COUNT(pi.id) as shift_count FROM payroll p
     LEFT JOIN payroll_items pi ON pi.payroll_id = p.id
     WHERE p.student_id = $1 GROUP BY p.id ORDER BY p.period_start DESC`,
    [studentId],
  )
  return result.rows
}

export async function getPayrollDetail(id: string, userId: string) {
  const result = await query(`SELECT * FROM payroll WHERE id = $1`, [id])
  if (!result.rowCount || result.rowCount === 0) throw createError('Not found', 404, 'NOT_FOUND')
  const payroll = result.rows[0]
  if (payroll.student_id !== userId && payroll.employer_id !== userId) {
    throw createError('Forbidden', 403, 'FORBIDDEN')
  }
  const items = await query(`SELECT pi.*, s.title as shift_title, s.start_time FROM payroll_items pi JOIN shifts s ON pi.shift_id = s.id WHERE pi.payroll_id = $1`, [id])
  return { ...payroll, items: items.rows }
}

export async function calculatePayroll(employerId: string, periodStart: string, periodEnd: string) {
  // Lấy tất cả attendance completed trong kỳ, chưa có payroll_item
  const attendanceResult = await query(
    `SELECT a.*, s.hourly_rate, s.start_time, s.end_time, s.employer_id, s.id as shift_id_val
     FROM attendance a
     JOIN shifts s ON a.shift_id = s.id
     WHERE s.employer_id = $1
       AND s.start_time >= $2 AND s.end_time <= $3
       AND a.check_out_time IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM payroll_items pi WHERE pi.attendance_id = a.id)`,
    [employerId, periodStart, periodEnd],
  )

  // Group by student
  const byStudent: Record<string, typeof attendanceResult.rows> = {}
  for (const row of attendanceResult.rows) {
    if (!byStudent[row.student_id]) byStudent[row.student_id] = []
    byStudent[row.student_id].push(row)
  }

  const payrolls = []
  for (const [studentId, records] of Object.entries(byStudent)) {
    let baseAmount = 0; let bonusAmount = 0; let penaltyAmount = 0
    const items = []

    for (const r of records) {
      const shiftHours = (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 3600000
      const result = calculatePay(r.hours_worked ?? 0, r.hourly_rate, r.late_minutes ?? 0, r.status === 'on_time', shiftHours)
      baseAmount += result.basePay; bonusAmount += result.bonus; penaltyAmount += result.penalty
      items.push({ ...r, ...result })
    }

    const totalAmount = baseAmount + bonusAmount - penaltyAmount
    const payrollResult = await query(
      `INSERT INTO payroll (student_id, employer_id, period_start, period_end, total_hours, base_amount, bonus_amount, penalty_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [studentId, employerId, periodStart, periodEnd, records.reduce((s, r) => s + (r.hours_worked ?? 0), 0), baseAmount, bonusAmount, penaltyAmount, totalAmount],
    )
    const payroll = payrollResult.rows[0]

    for (const item of items) {
      await query(
        `INSERT INTO payroll_items (payroll_id, shift_id, attendance_id, hours_worked, hourly_rate, subtotal, bonus, penalty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [payroll.id, item.shift_id_val, item.id, item.hours_worked, item.hourly_rate, item.basePay, item.bonus, item.penalty],
      )
    }

    notifyUser(studentId, 'payroll:updated', { payroll_id: payroll.id, total_amount: totalAmount, period: `${periodStart} - ${periodEnd}` })
    payrolls.push(payroll)
  }
  return payrolls
}

export async function confirmPayroll(id: string, employerId: string) {
  const result = await query(
    `UPDATE payroll SET status = 'confirmed' WHERE id = $1 AND employer_id = $2 AND status = 'draft' RETURNING *`,
    [id, employerId],
  )
  if (!result.rowCount || result.rowCount === 0) throw createError('Not found or invalid state', 404, 'NOT_FOUND')
  return result.rows[0]
}

export async function markPaid(id: string, employerId: string) {
  const result = await query(
    `UPDATE payroll SET status = 'paid', paid_at = NOW() WHERE id = $1 AND employer_id = $2 AND status = 'confirmed' RETURNING *`,
    [id, employerId],
  )
  if (!result.rowCount || result.rowCount === 0) throw createError('Not found or invalid state', 404, 'NOT_FOUND')
  return result.rows[0]
}
