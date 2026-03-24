export interface PayrollResult {
  basePay: number
  bonus: number
  penalty: number
  totalPay: number
}

export function calculatePay(
  hoursWorked: number,
  hourlyRate: number,
  lateMinutes: number,
  isOnTime: boolean,
  shiftHours: number,
): PayrollResult {
  const clampedHours = Math.min(hoursWorked, shiftHours)
  const basePay = clampedHours * hourlyRate

  const bonus = isOnTime && hoursWorked >= shiftHours ? basePay * 0.05 : 0

  let penalty = 0
  if (lateMinutes > 15) {
    penalty = basePay * 0.05
  } else if (lateMinutes > 0) {
    penalty = basePay * 0.02
  }

  const totalPay = basePay + bonus - penalty
  return { basePay, bonus, penalty, totalPay }
}
