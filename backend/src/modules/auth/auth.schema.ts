import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['student', 'employer']),
  student_id: z.string().optional(),
  university: z.string().optional(),
  company_name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  university: z.string().optional(),
  skills: z.array(z.string()).optional(),
  company_name: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})
