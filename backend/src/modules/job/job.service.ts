import { query } from '../../config/database'
import { createError } from '../../middleware/errorHandler'
import { z } from 'zod'
import { createJobSchema, updateJobSchema, patchStatusSchema } from './job.schema'

type CreateJobInput = z.infer<typeof createJobSchema>
type UpdateJobInput = z.infer<typeof updateJobSchema>
type PatchStatusInput = z.infer<typeof patchStatusSchema>

export async function createJob(employerId: string, input: CreateJobInput) {
  const result = await query(
    `INSERT INTO jobs (employer_id, title, description, hourly_rate, required_skills, max_workers)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [employerId, input.title, input.description ?? null, input.hourly_rate, input.required_skills, input.max_workers],
  )
  return result.rows[0]
}

export async function listJobs(role: string, employerId?: string, filters: { status?: string; page?: number; limit?: number } = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (role === 'employer' && employerId) {
    conditions.push(`employer_id = $${idx++}`)
    values.push(employerId)
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`)
    values.push(filters.status)
  } else if (role === 'student') {
    conditions.push(`status = 'active'`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  values.push(limit, offset)

  const result = await query(
    `SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  )
  return result.rows
}

export async function getJobById(id: string) {
  const result = await query('SELECT * FROM jobs WHERE id = $1', [id])
  if (!result.rowCount || result.rowCount === 0) throw createError('Job not found', 404, 'NOT_FOUND')
  return result.rows[0]
}

export async function updateJob(id: string, employerId: string, input: UpdateJobInput) {
  const job = await getJobById(id)
  if (job.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (input.title !== undefined) { fields.push(`title = $${idx++}`); values.push(input.title) }
  if (input.description !== undefined) { fields.push(`description = $${idx++}`); values.push(input.description) }
  if (input.hourly_rate !== undefined) { fields.push(`hourly_rate = $${idx++}`); values.push(input.hourly_rate) }
  if (input.max_workers !== undefined) { fields.push(`max_workers = $${idx++}`); values.push(input.max_workers) }

  if (fields.length === 0) return job
  values.push(id)
  const result = await query(`UPDATE jobs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, values)
  return result.rows[0]
}

export async function deleteJob(id: string, employerId: string) {
  const job = await getJobById(id)
  if (job.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')
  await query('DELETE FROM jobs WHERE id = $1', [id])
}

export async function patchStatus(id: string, employerId: string, input: PatchStatusInput) {
  const job = await getJobById(id)
  if (job.employer_id !== employerId) throw createError('Forbidden', 403, 'FORBIDDEN')
  const result = await query('UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [input.status, id])
  return result.rows[0]
}
