import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  hourly_rate: z.number().positive(),
  required_skills: z.array(z.string()).optional().default([]),
  max_workers: z.number().int().positive(),
})

export const updateJobSchema = createJobSchema.partial()

export const patchStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'closed']),
})
