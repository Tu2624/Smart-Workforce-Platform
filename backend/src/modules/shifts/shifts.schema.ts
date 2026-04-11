import { z } from 'zod'

export const createShiftSchema = z.object({
  body: z.object({
    job_id: z.string().uuid('Invalid job ID'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    max_workers: z.number().int().positive('Max workers must be a positive integer'),
    title: z.string().optional(),
    auto_assign: z.boolean().optional(),
  }).refine(data => new Date(data.end_time) > new Date(data.start_time), {
    message: 'End time must be after start time',
    path: ['end_time'],
  })
})

export const updateShiftSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    max_workers: z.number().int().positive().optional(),
    auto_assign: z.boolean().optional(),
  }).refine(data => {
    if (data.start_time && data.end_time) {
      return new Date(data.end_time) > new Date(data.start_time)
    }
    return true
  }, {
    message: 'End time must be after start time',
    path: ['end_time'],
  })
})
