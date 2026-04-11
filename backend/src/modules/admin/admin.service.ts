import pool from '../../config/database'

export class AdminService {
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
}

export const adminService = new AdminService()
