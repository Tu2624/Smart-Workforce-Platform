import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'
import { IJob } from '../../types'

export class JobsService {
  async createJob(employerId: string, data: Partial<IJob>): Promise<{ job: IJob }> {
    const { title, hourly_rate, max_workers, description, required_skills } = data
    const jobId = uuidv4()

    await pool.query(
      'INSERT INTO jobs (id, employer_id, title, description, hourly_rate, required_skills, max_workers) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [jobId, employerId, title, description ?? null, hourly_rate, JSON.stringify(required_skills ?? []), max_workers]
    )

    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId])
    const job = (rows as any[])[0]
    return { job: this._parseJob(job) }
  }

  async listJobs(role: string, userId: string, query: any): Promise<{ jobs: IJob[], pagination: any }> {
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const offset = (page - 1) * limit

    const conditions: string[] = []
    const values: any[] = []

    if (role === 'employer') {
      conditions.push('employer_id = ?')
      values.push(userId)
    } else if (role === 'student') {
      const [profileRows] = await pool.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId])
      const studentEmployerId = (profileRows as any[])[0]?.employer_id || null
      conditions.push("status = 'active'")
      conditions.push('employer_id = ?')
      values.push(studentEmployerId)
    }

    if (query.status && role === 'employer') {
      conditions.push('status = ?')
      values.push(query.status)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM jobs ${where}`, values)
    const total = (countRows as any[])[0].total

    const [rows] = await pool.query(
      `SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    )

    return {
      jobs: (rows as any[]).map(j => this._parseJob(j)),
      pagination: { page, limit, total }
    }
  }

  async getJob(jobId: string, role?: string, userId?: string): Promise<{ job: IJob }> {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId])
    const job = (rows as any[])[0]
    if (!job) throw new Error('JOB_NOT_FOUND')

    if (role === 'student' && userId) {
      const [profileRows] = await pool.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId])
      const profile = (profileRows as any[])[0]
      if (!profile || profile.employer_id.toLowerCase() !== job.employer_id.toLowerCase()) {
        throw new Error('FORBIDDEN')
      }
    }

    return { job: this._parseJob(job) }
  }

  async updateJob(jobId: string, employerId: string, data: Partial<IJob>): Promise<{ job: IJob }> {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId])
    const job = (rows as any[])[0]
    if (!job) throw new Error('JOB_NOT_FOUND')
    if (job.employer_id !== employerId) throw new Error('FORBIDDEN')

    const { title, hourly_rate, max_workers, description, required_skills } = data
    const updates: string[] = []
    const values: any[] = []

    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (hourly_rate !== undefined) { updates.push('hourly_rate = ?'); values.push(hourly_rate) }
    if (max_workers !== undefined) { updates.push('max_workers = ?'); values.push(max_workers) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (required_skills !== undefined) { updates.push('required_skills = ?'); values.push(JSON.stringify(required_skills)) }

    if (updates.length === 0) return this.getJob(jobId)

    values.push(jobId)
    await pool.query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`, values)
    return this.getJob(jobId)
  }

  async updateJobStatus(jobId: string, employerId: string, status: string): Promise<{ job: IJob }> {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId])
    const job = (rows as any[])[0]
    if (!job) throw new Error('JOB_NOT_FOUND')
    if (job.employer_id !== employerId) throw new Error('FORBIDDEN')

    await pool.query('UPDATE jobs SET status = ? WHERE id = ?', [status, jobId])
    return this.getJob(jobId)
  }

  async deleteJob(jobId: string, employerId: string): Promise<{ message: string }> {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId])
    const job = (rows as any[])[0]
    if (!job) throw new Error('JOB_NOT_FOUND')
    if (job.employer_id !== employerId) throw new Error('FORBIDDEN')

    const [shiftRows] = await pool.query(
      "SELECT COUNT(*) as count FROM shifts WHERE job_id = ? AND status NOT IN ('cancelled')",
      [jobId]
    )
    if ((shiftRows as any[])[0].count > 0) throw new Error('CANNOT_DELETE_JOB')

    await pool.query('DELETE FROM jobs WHERE id = ?', [jobId])
    return { message: 'Job deleted successfully' }
  }

  private _parseJob(job: any): IJob {
    return {
      ...job,
      hourly_rate: parseFloat(job.hourly_rate),
      required_skills: typeof job.required_skills === 'string'
        ? JSON.parse(job.required_skills)
        : (job.required_skills ?? []),
    }
  }
}

export const jobsService = new JobsService()
