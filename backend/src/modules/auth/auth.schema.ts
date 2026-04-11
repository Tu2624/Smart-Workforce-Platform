import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
})

export const registerEmployerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(2, 'Full name is required'),
    phone: z.string().optional(),
    company_name: z.string().min(2, 'Company name is required'),
    address: z.string().optional(),
    description: z.string().optional()
  })
})

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string(),
    new_password: z.string().min(8, 'New password must be at least 8 characters')
  })
})

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url().optional(),
    // Employer fields
    company_name: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    // Student fields
    student_id: z.string().optional(),
    university: z.string().optional(),
    skills: z.array(z.string()).optional()
  })
})
