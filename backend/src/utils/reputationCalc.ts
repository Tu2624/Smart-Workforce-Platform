import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'

const DELTAS: Record<string, number> = {
  on_time_checkin:      +2.0,
  complete_shift:       +3.0,
  good_rating:          +5.0,
  late_minor:           -2.0,
  late_major:           -5.0,
  absent:               -10.0,
  cancel_approved_late: -7.0,
  bad_rating:           -8.0,
}

export async function adjustReputation(studentId: string, eventType: string, reason?: string) {
  const delta = DELTAS[eventType]
  if (delta === undefined) return

  await pool.query(
    'INSERT INTO reputation_events (id, student_id, event_type, delta, reason) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), studentId, eventType, delta, reason ?? null]
  )
  await pool.query(
    `UPDATE student_profiles
     SET reputation_score = LEAST(200, GREATEST(0, reputation_score + ?))
     WHERE user_id = ?`,
    [delta, studentId]
  )
}
