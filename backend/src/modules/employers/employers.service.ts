// @ts-ignore
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'

const TEMP_PASSWORD_LENGTH = 10
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateTempPassword(): string {
  let result = ''
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length))
  }
  return result
}

export class EmployersService {
  async createEmployee(employerId: string, data: any) {
    const { email, full_name, phone, student_id, university } = data

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const userId = uuidv4()

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      await connection.query(
        'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email, passwordHash, full_name, phone ?? null, 'student']
      )

      await connection.query(
        'INSERT INTO student_profiles (id, user_id, employer_id, student_id, university) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, employerId, student_id ?? null, university ?? null]
      )

      await connection.commit()

      return {
        message: 'Employee account created successfully',
        user: { id: userId, email, role: 'student' },
        temp_password: tempPassword,
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async getStats(employerId: string) {
    const [empRows] = await pool.query('SELECT COUNT(*) as count FROM student_profiles WHERE employer_id = ?', [employerId])
    const employeeCount = (empRows as any[])[0].count

    const [shiftRows] = await pool.query(
      `SELECT COUNT(*) as count FROM shifts WHERE employer_id = ? AND DATE(start_time) = CURDATE() AND status NOT IN ('cancelled')`,
      [employerId]
    )
    const todayShiftsCount = (shiftRows as any[])[0].count

    return {
      employees: employeeCount,
      today_shifts: todayShiftsCount
    }
  }
}

export const employersService = new EmployersService()
