import { z } from 'zod'

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên vị trí không được để trống').max(100),
    description: z.string().max(255).optional(),
  })
})

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(255).optional(),
  }),
  params: z.object({
    role_id: z.string().uuid(),
  })
})
