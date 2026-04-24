import { v4 as uuidv4 } from 'uuid'
// @ts-ignore
import bcrypt from 'bcryptjs'
import pool from '../../config/database'

export class AdminService {
  async getStats() {
    const [[userRow]] = await pool.query('SELECT COUNT(*) as total FROM users') as any
    const [[jobRow]] = await pool.query('SELECT COUNT(*) as total FROM jobs') as any
    const [[shiftRow]] = await pool.query('SELECT COUNT(*) as total FROM shifts') as any
    const [[payrollRow]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM payroll WHERE status = 'paid'`
    ) as any
    return {
      total_users: Number(userRow.total),
      total_jobs: Number(jobRow.total),
      total_shifts: Number(shiftRow.total),
      total_payroll_paid: parseFloat(payrollRow.total),
    }
  }

  async listUsers(query: any) {
    const role = query.role
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const offset = (page - 1) * limit

    let sql = 'SELECT id, email, full_name, role, phone, is_active, created_at FROM users'
    const params: any[] = []

    if (role) {
      sql += ' WHERE role = ?'
      params.push(role)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query(sql, params)
    
    const [countRows] = await pool.query(
      role ? 'SELECT COUNT(*) as count FROM users WHERE role = ?' : 'SELECT COUNT(*) as count FROM users',
      role ? [role] : []
    )
    const total = (countRows as any[])[0].count

    return {
      users: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async createEmployer(data: { email: string; full_name: string; password: string; phone?: string; company_name?: string }) {
    const { email, full_name, password, phone, company_name } = data

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if ((existing as any[]).length > 0) throw new Error('EMAIL_TAKEN')

    const hashed = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, hashed, full_name, 'employer', phone ?? null]
    )

    const profileId = uuidv4()
    await pool.query(
      'INSERT INTO employer_profiles (id, user_id, company_name) VALUES (?, ?, ?)',
      [profileId, userId, company_name ?? null]
    )

    return { id: userId, email, full_name, role: 'employer' }
  }

  async toggleUserStatus(userId: string) {
    const [rows] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [userId])
    const user = (rows as any[])[0]
    if (!user) throw new Error('USER_NOT_FOUND')
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [!user.is_active, userId])
    return { is_active: !user.is_active }
  }
}

export const adminService = new AdminService()
