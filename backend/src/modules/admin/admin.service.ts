import { query } from '../../config/database'

export async function listUsers(filters: Record<string, string> = {}) {
  const { role, is_active, page = '1', limit = '20' } = filters
  const values: unknown[] = []
  const conditions: string[] = []
  let idx = 1
  if (role) { conditions.push(`role = $${idx++}`); values.push(role) }
  if (is_active !== undefined) { conditions.push(`is_active = $${idx++}`); values.push(is_active === 'true') }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit))
  const result = await query(
    `SELECT id, email, full_name, role, is_active, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  )
  return result.rows
}

export async function toggleUserStatus(id: string) {
  const result = await query(
    `UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active`,
    [id],
  )
  return result.rows[0]
}

export async function listAllJobs(filters: Record<string, string> = {}) {
  const { page = '1', limit = '20' } = filters
  const result = await query(
    `SELECT j.*, u.full_name as employer_name FROM jobs j JOIN users u ON j.employer_id = u.id ORDER BY j.created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
  )
  return result.rows
}

export async function getSystemStats() {
  const [users, jobs, shifts, payroll] = await Promise.all([
    query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
    query(`SELECT status, COUNT(*) as count FROM jobs GROUP BY status`),
    query(`SELECT status, COUNT(*) as count FROM shifts GROUP BY status`),
    query(`SELECT COALESCE(SUM(total_amount),0) as total_revenue FROM payroll WHERE status = 'paid'`),
  ])
  return {
    users: users.rows,
    jobs: jobs.rows,
    shifts: shifts.rows,
    total_revenue: parseFloat(payroll.rows[0].total_revenue),
  }
}
