import { z } from 'zod'

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(['admin', 'employer', 'student']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
})
