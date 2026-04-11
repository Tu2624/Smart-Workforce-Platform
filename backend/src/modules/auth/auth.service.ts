import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export class AuthService {
  async registerEmployer(data: any) {
    const { email, password, full_name, phone, company_name, address, description } = data
    const userId = uuidv4()
    const passwordHash = await bcrypt.hash(password, 10)

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create user
      await connection.query(
        'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email, passwordHash, full_name, phone, 'employer']
      )

      // Create employer profile
      await connection.query(
        'INSERT INTO employer_profiles (id, user_id, company_name, address, description) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, company_name, address, description]
      )

      await connection.commit()

      const token = jwt.sign({ id: userId, email, role: 'employer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
      
      return {
        user: { id: userId, email, full_name, role: 'employer' },
        token
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async login(email: string, password: string) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = true', [email])
    const user = (rows as any[])[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    }
  }

  async getMe(userId: string, role: string) {
    const [userRows] = await pool.query('SELECT id, email, role, full_name, phone, avatar_url FROM users WHERE id = ?', [userId])
    const user = (userRows as any[])[0]

    if (!user) throw new Error('USER_NOT_FOUND')

    let profile = null
    if (role === 'employer') {
      const [profileRows] = await pool.query('SELECT * FROM employer_profiles WHERE user_id = ?', [userId])
      profile = (profileRows as any[])[0]
    } else if (role === 'student') {
      const [profileRows] = await pool.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId])
      profile = (profileRows as any[])[0]
    }

    return { ...user, profile }
  }

  async updateProfile(userId: string, role: string, data: any) {
    const { full_name, phone, avatar_url, ...profileData } = data

    // Update user table
    if (full_name || phone || avatar_url) {
      const updates: string[] = []
      const values: any[] = []
      if (full_name) { updates.push('full_name = ?'); values.push(full_name) }
      if (phone) { updates.push('phone = ?'); values.push(phone) }
      if (avatar_url) { updates.push('avatar_url = ?'); values.push(avatar_url) }
      
      if (updates.length > 0) {
        values.push(userId)
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
      }
    }

    // Update profile table
    if (Object.keys(profileData).length > 0) {
      if (role === 'employer') {
        const { company_name, address, description } = profileData
        const updates: string[] = []
        const values: any[] = []
        if (company_name) { updates.push('company_name = ?'); values.push(company_name) }
        if (address) { updates.push('address = ?'); values.push(address) }
        if (description) { updates.push('description = ?'); values.push(description) }
        
        if (updates.length > 0) {
          values.push(userId)
          await pool.query(`UPDATE employer_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values)
        }
      } else if (role === 'student') {
        const { university, skills } = profileData
        const updates: string[] = []
        const values: any[] = []
        if (university) { updates.push('university = ?'); values.push(university) }
        if (skills) { updates.push('skills = ?'); values.push(JSON.stringify(skills)) }
        
        if (updates.length > 0) {
          values.push(userId)
          await pool.query(`UPDATE student_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values)
        }
      }
    }

    return this.getMe(userId, role)
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId])
    const user = (rows as any[])[0]

    if (!user || !(await bcrypt.compare(currentPass, user.password_hash))) {
      throw new Error('INVALID_CURRENT_PASSWORD')
    }

    const newHash = await bcrypt.hash(newPass, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId])
  }
}

export const authService = new AuthService()
