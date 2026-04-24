import { v4 as uuidv4 } from 'uuid'
import pool from '../../config/database'
import { adjustReputation } from '../../utils/reputationCalc'

export class RatingsService {
  async createRating(employerId: string, data: { shift_id: string; student_id: string; score: number; comment?: string }) {
    const { shift_id, student_id, score, comment } = data

    // Shift phải completed và thuộc employer này
    const [shiftRows] = await pool.query(
      "SELECT id, status, employer_id FROM shifts WHERE id = ? AND employer_id = ? AND status = 'completed'",
      [shift_id, employerId]
    )
    if ((shiftRows as any[]).length === 0) throw new Error('SHIFT_NOT_ELIGIBLE')

    // Student phải có approved registration trong shift này
    const [regRows] = await pool.query(
      "SELECT id FROM shift_registrations WHERE shift_id = ? AND student_id = ? AND status = 'approved'",
      [shift_id, student_id]
    )
    if ((regRows as any[]).length === 0) throw new Error('STUDENT_NOT_IN_SHIFT')

    // Không được rating 2 lần cho cùng shift + student
    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE shift_id = ? AND student_id = ?',
      [shift_id, student_id]
    )
    if ((existing as any[]).length > 0) throw new Error('ALREADY_RATED')

    const id = uuidv4()
    await pool.query(
      'INSERT INTO ratings (id, shift_id, student_id, employer_id, score, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [id, shift_id, student_id, employerId, score, comment ?? null]
    )

    // Cập nhật reputation
    if (score >= 4) await adjustReputation(student_id, 'good_rating', `Đánh giá ${score} sao từ ca ${shift_id}`)
    else if (score <= 2) await adjustReputation(student_id, 'bad_rating', `Đánh giá ${score} sao từ ca ${shift_id}`)

    const [rows] = await pool.query('SELECT * FROM ratings WHERE id = ?', [id])
    return { rating: (rows as any[])[0] }
  }

  async listStudentRatings(studentId: string) {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS employer_name, ep.company_name,
              s.title AS shift_title, s.start_time
       FROM ratings r
       JOIN users u ON u.id = r.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = r.employer_id
       LEFT JOIN shifts s ON s.id = r.shift_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [studentId]
    )
    return { ratings: rows }
  }
}

export const ratingsService = new RatingsService()
