import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema'

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body)
    const result = await authService.register(input)
    res.status(201).json({ message: 'Đăng ký thành công', ...result })
  } catch (err) { next(err) }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body)
    const result = await authService.login(input)
    res.json(result)
  } catch (err) { next(err) }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id)
    res.json({ user })
  } catch (err) { next(err) }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateProfileSchema.parse(req.body)
    const user = await authService.updateProfile(req.user!.id, input)
    res.json({ user })
  } catch (err) { next(err) }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = changePasswordSchema.parse(req.body)
    await authService.changePassword(req.user!.id, input)
    res.json({ message: 'Password changed successfully' })
  } catch (err) { next(err) }
}
