import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'

  if (statusCode === 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    error: code,
    message: err.message ?? 'Internal server error',
  })
}

export function createError(message: string, statusCode: number, code: string): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}
