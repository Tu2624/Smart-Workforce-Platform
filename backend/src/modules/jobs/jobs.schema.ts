import { z } from 'zod'

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    hourly_rate: z.number().positive('Hourly rate must be positive'),
    max_workers: z.number().int().positive('Max workers must be a positive integer'),
    description: z.string().optional(),
    required_skills: z.array(z.string()).optional(),
  })
})

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    hourly_rate: z.number().positive().optional(),
    max_workers: z.number().int().positive().optional(),
    description: z.string().optional(),
    required_skills: z.array(z.string()).optional(),
  })
})

export const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'paused', 'closed']),
  })
})
