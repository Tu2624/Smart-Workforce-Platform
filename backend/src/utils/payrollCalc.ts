export function calcPayrollItem(params: {
  shiftDurationHours: number
  hourlyRate: number
  lateMinutes: number
  earlyMinutes: number
  isIncomplete: boolean
}) {
  const { shiftDurationHours, hourlyRate, lateMinutes, earlyMinutes, isIncomplete } = params

  if (isIncomplete) {
    return {
      scheduled_hours: shiftDurationHours,
      hours_worked: 0,
      deduction_minutes: 0,
      deduction_amount: 0,
      subtotal: 0,
    }
  }

  const deductionMinutes = lateMinutes + earlyMinutes
  const deductionAmount = (deductionMinutes / 60) * hourlyRate
  const hoursWorked = Math.max(0, shiftDurationHours - deductionMinutes / 60)
  const subtotal = Math.max(0, shiftDurationHours * hourlyRate - deductionAmount)

  return {
    scheduled_hours: shiftDurationHours,
    hours_worked: hoursWorked,
    deduction_minutes: deductionMinutes,
    deduction_amount: deductionAmount,
    subtotal,
  }
}
