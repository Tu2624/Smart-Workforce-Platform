import { z } from 'zod'

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().min(2, 'Full name is required'),
    phone: z.string().optional(),
    student_id: z.string().optional(),
    university: z.string().optional(),
    role_id: z.string().uuid().optional(),
  })
})

export const updateEmployeeSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, 'Full name is required').optional(),
    phone: z.string().optional(),
    student_id: z.string().optional(),
    university: z.string().optional(),
    role_id: z.string().uuid().nullable().optional(),
  })
})
