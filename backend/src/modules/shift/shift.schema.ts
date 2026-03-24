import { z } from 'zod'

export const createShiftSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(2).optional(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  max_workers: z.number().int().positive(),
  auto_assign: z.boolean().default(false),
})

export const updateShiftSchema = createShiftSchema.partial().omit({ job_id: true })

export const reviewRegistrationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})
