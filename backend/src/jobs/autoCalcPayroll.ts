import cron from 'node-cron'
import { env } from '../config/env'
import { query } from '../config/database'
import { calculatePay } from '../utils/payrollCalc'
import { notifyUser } from '../config/socket'

export function startAutoCalcPayroll(): void {
  cron.schedule(env.cron.payroll, async () => {
    console.log('[AutoPayroll] Running payroll calculation...')
    try {
      const today = new Date()
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const periodEnd = today.toISOString().split('T')[0]

      const attendanceResult = await query(
        `SELECT a.*, s.hourly_rate, s.start_time, s.end_time, s.employer_id, s.id as shift_id_val
         FROM attendance a
         JOIN shifts s ON a.shift_id = s.id
         WHERE a.check_out_time IS NOT NULL AND a.hours_worked IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM payroll_items pi WHERE pi.attendance_id = a.id)
           AND DATE(s.start_time) >= $1`,
        [periodStart],
      )

      const byStudentEmployer: Record<string, typeof attendanceResult.rows> = {}
      for (const row of attendanceResult.rows) {
        const key = `${row.student_id}:${row.employer_id}`
        if (!byStudentEmployer[key]) byStudentEmployer[key] = []
        byStudentEmployer[key].push(row)
      }

      for (const [key, records] of Object.entries(byStudentEmployer)) {
        const [studentId, employerId] = key.split(':')
        let baseAmount = 0, bonusAmount = 0, penaltyAmount = 0, totalHours = 0

        const items = records.map((r) => {
          const shiftHours = (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 3600000
          const result = calculatePay(r.hours_worked ?? 0, r.hourly_rate, r.late_minutes ?? 0, r.status === 'on_time', shiftHours)
          baseAmount += result.basePay; bonusAmount += result.bonus; penaltyAmount += result.penalty; totalHours += r.hours_worked ?? 0
          return { ...r, ...result }
        })

        const totalAmount = baseAmount + bonusAmount - penaltyAmount
        const existingPayroll = await query(`SELECT id FROM payroll WHERE student_id=$1 AND employer_id=$2 AND period_start=$3`, [studentId, employerId, periodStart])
        let payrollId: string

        if (existingPayroll.rowCount && existingPayroll.rowCount > 0) {
          payrollId = existingPayroll.rows[0].id
          await query(
            `UPDATE payroll SET total_hours=$1, base_amount=$2, bonus_amount=$3, penalty_amount=$4, total_amount=$5 WHERE id=$6`,
            [totalHours, baseAmount, bonusAmount, penaltyAmount, totalAmount, payrollId],
          )
        } else {
          const r = await query(
            `INSERT INTO payroll (student_id, employer_id, period_start, period_end, total_hours, base_amount, bonus_amount, penalty_amount, total_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [studentId, employerId, periodStart, periodEnd, totalHours, baseAmount, bonusAmount, penaltyAmount, totalAmount],
          )
          payrollId = r.rows[0].id
        }

        for (const item of items) {
          await query(
            `INSERT INTO payroll_items (payroll_id, shift_id, attendance_id, hours_worked, hourly_rate, subtotal, bonus, penalty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
            [payrollId, item.shift_id_val, item.id, item.hours_worked, item.hourly_rate, item.basePay, item.bonus, item.penalty],
          )
        }

        try {
          notifyUser(studentId, 'payroll:updated', { payroll_id: payrollId, total_amount: totalAmount })
        } catch { /* socket may not be ready */ }
      }

      console.log(`[AutoPayroll] Done. Processed ${Object.keys(byStudentEmployer).length} payroll records.`)
    } catch (err) {
      console.error('[AutoPayroll] Error:', err)
    }
  })
}
