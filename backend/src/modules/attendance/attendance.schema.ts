import { z } from 'zod'

export const checkInSchema = z.object({ shift_id: z.string().uuid() })
export const checkOutSchema = z.object({ shift_id: z.string().uuid() })
export const patchAttendanceSchema = z.object({
  note: z.string().optional(),
  status: z.enum(['on_time', 'late', 'absent', 'pending']).optional(),
})
