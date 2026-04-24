// Unit tests cho attendance late-detection logic (pure functions, không cần DB)

const LATE_THRESHOLD_MINUTES = 5

function calcLateMinutes(checkInTime: Date, shiftStartTime: Date): number {
  return Math.max(0, Math.floor((checkInTime.getTime() - shiftStartTime.getTime()) / 60000))
}

function determineStatus(lateMinutes: number): 'on_time' | 'late' {
  return lateMinutes > LATE_THRESHOLD_MINUTES ? 'late' : 'on_time'
}

function calcEarlyMinutes(checkOutTime: Date, shiftEndTime: Date): number {
  return Math.max(0, Math.floor((shiftEndTime.getTime() - checkOutTime.getTime()) / 60000))
}

describe('Late detection', () => {
  const shiftStart = new Date('2025-06-01T08:00:00')

  it('check-in đúng giờ → on_time', () => {
    const checkIn = new Date('2025-06-01T08:00:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(0)
    expect(determineStatus(late)).toBe('on_time')
  })

  it('check-in trễ 3 phút (trong threshold) → on_time', () => {
    const checkIn = new Date('2025-06-01T08:03:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(3)
    expect(determineStatus(late)).toBe('on_time')
  })

  it('check-in trễ đúng 5 phút (bằng threshold) → on_time', () => {
    const checkIn = new Date('2025-06-01T08:05:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(5)
    expect(determineStatus(late)).toBe('on_time')
  })

  it('check-in trễ 6 phút (vượt threshold) → late', () => {
    const checkIn = new Date('2025-06-01T08:06:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(6)
    expect(determineStatus(late)).toBe('late')
  })

  it('check-in trễ 30 phút → late với đúng số phút', () => {
    const checkIn = new Date('2025-06-01T08:30:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(30)
    expect(determineStatus(late)).toBe('late')
  })

  it('check-in trước giờ bắt đầu → 0 phút trễ', () => {
    const checkIn = new Date('2025-06-01T07:55:00')
    const late = calcLateMinutes(checkIn, shiftStart)
    expect(late).toBe(0)
    expect(determineStatus(late)).toBe('on_time')
  })
})

describe('Early checkout detection', () => {
  const shiftEnd = new Date('2025-06-01T17:00:00')

  it('checkout đúng giờ → 0 phút về sớm', () => {
    const checkOut = new Date('2025-06-01T17:00:00')
    expect(calcEarlyMinutes(checkOut, shiftEnd)).toBe(0)
  })

  it('checkout sớm 30 phút → 30 phút về sớm', () => {
    const checkOut = new Date('2025-06-01T16:30:00')
    expect(calcEarlyMinutes(checkOut, shiftEnd)).toBe(30)
  })

  it('checkout muộn hơn giờ kết thúc → 0 phút về sớm', () => {
    const checkOut = new Date('2025-06-01T17:15:00')
    expect(calcEarlyMinutes(checkOut, shiftEnd)).toBe(0)
  })
})
