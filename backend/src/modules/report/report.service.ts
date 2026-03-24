import { query } from '../../config/database'

export async function getOverview(employerId: string) {
  const [shifts, cost, workers] = await Promise.all([
    query(`SELECT COUNT(*) as total_shifts FROM shifts WHERE employer_id = $1`, [employerId]),
    query(`SELECT COALESCE(SUM(total_amount),0) as total_cost FROM payroll WHERE employer_id = $1 AND EXTRACT(MONTH FROM period_start) = EXTRACT(MONTH FROM NOW())`, [employerId]),
    query(`SELECT COUNT(DISTINCT student_id) as total_workers FROM shift_registrations sr JOIN shifts s ON sr.shift_id = s.id WHERE s.employer_id = $1 AND sr.status = 'approved'`, [employerId]),
  ])
  return {
    total_shifts: parseInt(shifts.rows[0].total_shifts),
    monthly_cost: parseFloat(cost.rows[0].total_cost),
    total_workers: parseInt(workers.rows[0].total_workers),
  }
}

export async function getShiftStats(employerId: string, from: string, to: string) {
  const result = await query(
    `SELECT DATE(start_time) as date, COUNT(*) as count, status FROM shifts WHERE employer_id = $1 AND start_time >= $2 AND start_time <= $3 GROUP BY DATE(start_time), status ORDER BY date`,
    [employerId, from, to],
  )
  return result.rows
}

export async function getPerformance(employerId: string) {
  const result = await query(
    `SELECT u.id, u.full_name, sp.reputation_score, sp.total_shifts_done,
     COUNT(a.id) as total_attended,
     SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END) as on_time_count,
     SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count
     FROM users u
     JOIN student_profiles sp ON sp.user_id = u.id
     JOIN attendance a ON a.student_id = u.id
     JOIN shifts s ON a.shift_id = s.id
     WHERE s.employer_id = $1
     GROUP BY u.id, u.full_name, sp.reputation_score, sp.total_shifts_done
     ORDER BY sp.reputation_score DESC`,
    [employerId],
  )
  return result.rows
}

export async function getPayrollSummary(employerId: string) {
  const result = await query(
    `SELECT EXTRACT(YEAR FROM period_start) as year, EXTRACT(MONTH FROM period_start) as month,
     COUNT(*) as payroll_count, SUM(total_amount) as total_cost
     FROM payroll WHERE employer_id = $1
     GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 12`,
    [employerId],
  )
  return result.rows
}
