export interface ShiftTime {
  start_time: Date | string
  end_time: Date | string
}

export function hasConflict(newShift: ShiftTime, existingShifts: ShiftTime[]): boolean {
  const newStart = new Date(newShift.start_time).getTime()
  const newEnd = new Date(newShift.end_time).getTime()

  return existingShifts.some((shift) => {
    const existStart = new Date(shift.start_time).getTime()
    const existEnd = new Date(shift.end_time).getTime()
    return newStart < existEnd && newEnd > existStart
  })
}
