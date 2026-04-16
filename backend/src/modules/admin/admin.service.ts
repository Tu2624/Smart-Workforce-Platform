import pool from '../../config/database'

export class AdminService {
  async getStats() {
    const [[userRow]] = await pool.query('SELECT COUNT(*) as total FROM users') as any
    const [[jobRow]] = await pool.query('SELECT COUNT(*) as total FROM jobs') as any
    const [[shiftRow]] = await pool.query('SELECT COUNT(*) as total FROM shifts') as any
    return {
      total_users: Number(userRow.total),
      total_jobs: Number(jobRow.total),
      total_shifts: Number(shiftRow.total),
    }
  }

  async listUsers(query: any) {
    const role = query.role
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const offset = (page - 1) * limit

    let sql = 'SELECT id, email, full_name, role, phone, created_at FROM users'
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

  async toggleUserStatus(userId: string) {
    const [rows] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [userId])
    const user = (rows as any[])[0]
    if (!user) throw new Error('USER_NOT_FOUND')
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [!user.is_active, userId])
    return { is_active: !user.is_active }
  }
}

export const adminService = new AdminService()
