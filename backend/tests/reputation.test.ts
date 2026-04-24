// Unit tests cho reputation delta values và scoring bounds

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

function applyDelta(currentScore: number, eventType: string): number {
  const delta = DELTAS[eventType]
  if (delta === undefined) return currentScore
  return Math.min(200, Math.max(0, currentScore + delta))
}

describe('Reputation deltas — giá trị đúng', () => {
  it('on_time_checkin → +2.0', () => expect(DELTAS.on_time_checkin).toBe(2.0))
  it('complete_shift  → +3.0', () => expect(DELTAS.complete_shift).toBe(3.0))
  it('good_rating     → +5.0', () => expect(DELTAS.good_rating).toBe(5.0))
  it('late_minor      → -2.0', () => expect(DELTAS.late_minor).toBe(-2.0))
  it('late_major      → -5.0', () => expect(DELTAS.late_major).toBe(-5.0))
  it('absent          → -10.0', () => expect(DELTAS.absent).toBe(-10.0))
  it('cancel_approved_late → -7.0', () => expect(DELTAS.cancel_approved_late).toBe(-7.0))
  it('bad_rating      → -8.0', () => expect(DELTAS.bad_rating).toBe(-8.0))
})

describe('Reputation score bounds', () => {
  it('score không tăng quá 200', () => {
    expect(applyDelta(199, 'good_rating')).toBe(200)    // 199 + 5 = capped at 200
    expect(applyDelta(200, 'on_time_checkin')).toBe(200)
  })

  it('score không xuống dưới 0', () => {
    expect(applyDelta(5, 'absent')).toBe(0)    // 5 - 10 = floored at 0
    expect(applyDelta(0, 'bad_rating')).toBe(0)
  })

  it('event không xác định → giữ nguyên score', () => {
    expect(applyDelta(100, 'unknown_event')).toBe(100)
  })

  it('score mặc định 100 + on_time → 102', () => {
    expect(applyDelta(100, 'on_time_checkin')).toBe(102)
  })

  it('score <50 sau absent nhiều lần', () => {
    let score = 60
    score = applyDelta(score, 'absent')   // 50
    score = applyDelta(score, 'absent')   // 40
    expect(score).toBe(40)
  })

  it('score ≥150 sau nhiều lần on_time + complete', () => {
    let score = 100
    for (let i = 0; i < 10; i++) {
      score = applyDelta(score, 'on_time_checkin')  // +2 mỗi lần
      score = applyDelta(score, 'complete_shift')   // +3 mỗi lần
    }
    expect(score).toBe(150)
  })
})
