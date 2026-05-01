import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'
import { AppError } from '../../utils/appError'

export class RolesService {
  async listRoles(employerId: string) {
    const [rows] = await pool.query(
      'SELECT * FROM employer_roles WHERE employer_id = ? ORDER BY created_at ASC',
      [employerId]
    )
    return { roles: rows as any[] }
  }

  async createRole(employerId: string, data: { name: string; description?: string }) {
    const { name, description } = data
    const id = uuidv4()
    try {
      await pool.query(
        'INSERT INTO employer_roles (id, employer_id, name, description) VALUES (?, ?, ?, ?)',
        [id, employerId, name, description ?? null]
      )
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'Tên vị trí đã tồn tại trong công ty', 'ROLE_NAME_DUPLICATE')
      }
      throw err
    }
    const [rows] = await pool.query('SELECT * FROM employer_roles WHERE id = ?', [id])
    return { role: (rows as any[])[0] }
  }

  async updateRole(employerId: string, roleId: string, data: { name?: string; description?: string }) {
    const [existing] = await pool.query(
      'SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?',
      [roleId, employerId]
    )
    if (!(existing as any[]).length) {
      throw new AppError(404, 'Không tìm thấy vị trí', 'ROLE_NOT_FOUND')
    }

    const { name, description } = data
    const updates: string[] = []
    const values: any[] = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }

    if (updates.length) {
      values.push(roleId)
      try {
        await pool.query(`UPDATE employer_roles SET ${updates.join(', ')} WHERE id = ?`, values)
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new AppError(409, 'Tên vị trí đã tồn tại trong công ty', 'ROLE_NAME_DUPLICATE')
        }
        throw err
      }
    }

    const [rows] = await pool.query('SELECT * FROM employer_roles WHERE id = ?', [roleId])
    return { role: (rows as any[])[0] }
  }

  async deleteRole(employerId: string, roleId: string) {
    const [existing] = await pool.query(
      'SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?',
      [roleId, employerId]
    )
    if (!(existing as any[]).length) {
      throw new AppError(404, 'Không tìm thấy vị trí', 'ROLE_NOT_FOUND')
    }
    // ON DELETE SET NULL handles student_profiles.role_id automatically
    await pool.query('DELETE FROM employer_roles WHERE id = ?', [roleId])
    return { message: 'Đã xóa vị trí thành công' }
  }
}

export const rolesService = new RolesService()
