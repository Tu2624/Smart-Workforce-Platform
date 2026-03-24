import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../../config/database'
import { env } from '../../config/env'
import { createError } from '../../middleware/errorHandler'
import { z } from 'zod'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema'

type RegisterInput = z.infer<typeof registerSchema>
type LoginInput = z.infer<typeof loginSchema>
type UpdateProfileInput = z.infer<typeof updateProfileSchema>
type ChangePasswordInput = z.infer<typeof changePasswordSchema>

function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions)
}

export async function register(input: RegisterInput) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [input.email])
  if (existing.rowCount && existing.rowCount > 0) {
    throw createError('Email already registered', 409, 'EMAIL_EXISTS')
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const userResult = await query<{ id: string; email: string; role: string }>(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role`,
    [input.email, passwordHash, input.full_name, input.phone ?? null, input.role],
  )
  const user = userResult.rows[0]

  if (input.role === 'student') {
    await query(
      `INSERT INTO student_profiles (user_id, student_id, university) VALUES ($1, $2, $3)`,
      [user.id, input.student_id ?? null, input.university ?? null],
    )
  } else if (input.role === 'employer') {
    await query(
      `INSERT INTO employer_profiles (user_id, company_name) VALUES ($1, $2)`,
      [user.id, input.company_name ?? ''],
    )
  }

  const token = signToken(user)
  return { user, token }
}

export async function login(input: LoginInput) {
  const result = await query<{
    id: string; email: string; role: string; password_hash: string; full_name: string
  }>(
    'SELECT id, email, role, password_hash, full_name FROM users WHERE email = $1 AND is_active = true',
    [input.email],
  )
  if (!result.rowCount || result.rowCount === 0) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
  }
  const user = result.rows[0]
  const valid = await bcrypt.compare(input.password, user.password_hash)
  if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

  const { password_hash: _, ...safeUser } = user
  const token = signToken(safeUser)
  return { user: safeUser, token }
}

export async function getMe(userId: string) {
  const result = await query<{ id: string; email: string; role: string; full_name: string; phone: string; avatar_url: string }>(
    'SELECT id, email, role, full_name, phone, avatar_url FROM users WHERE id = $1',
    [userId],
  )
  if (!result.rowCount || result.rowCount === 0) {
    throw createError('User not found', 404, 'NOT_FOUND')
  }
  return result.rows[0]
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (input.full_name) { fields.push(`full_name = $${idx++}`); values.push(input.full_name) }
  if (input.phone) { fields.push(`phone = $${idx++}`); values.push(input.phone) }
  if (input.avatar_url) { fields.push(`avatar_url = $${idx++}`); values.push(input.avatar_url) }

  if (fields.length > 0) {
    values.push(userId)
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, values)
  }
  return getMe(userId)
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const result = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  )
  const user = result.rows[0]
  const valid = await bcrypt.compare(input.current_password, user.password_hash)
  if (!valid) throw createError('Current password is incorrect', 400, 'WRONG_PASSWORD')

  const newHash = await bcrypt.hash(input.new_password, 10)
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId])
}
