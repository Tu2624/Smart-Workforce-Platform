import { z } from 'zod'

export const createRatingSchema = z.object({
  body: z.object({
    shift_id:   z.string().uuid(),
    student_id: z.string().uuid(),
    score:      z.number().int().min(1).max(5),
    comment:    z.string().max(500).optional(),
  }),
})
