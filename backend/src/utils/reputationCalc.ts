export type ReputationEventType =
  | 'on_time_checkin'
  | 'shift_completed'
  | 'good_review'
  | 'late_minor'      // 1–15 min
  | 'late_major'      // >15 min
  | 'absent'
  | 'cancel_last_minute'
  | 'bad_review'

const DELTA_MAP: Record<ReputationEventType, number> = {
  on_time_checkin: 2,
  shift_completed: 3,
  good_review: 5,
  late_minor: -2,
  late_major: -5,
  absent: -10,
  cancel_last_minute: -7,
  bad_review: -8,
}

const MIN_SCORE = 0
const MAX_SCORE = 200

export function applyReputationEvent(
  currentScore: number,
  eventType: ReputationEventType,
): { newScore: number; delta: number } {
  const delta = DELTA_MAP[eventType]
  const newScore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, currentScore + delta))
  return { newScore, delta }
}

export function getReputationTier(score: number): 'high' | 'normal' | 'low' | 'blocked' {
  if (score >= 150) return 'high'
  if (score >= 100) return 'normal'
  if (score >= 50) return 'low'
  return 'blocked'
}
