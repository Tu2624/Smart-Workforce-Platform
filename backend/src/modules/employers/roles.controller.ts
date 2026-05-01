import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { rolesService } from './roles.service'

export class RolesController {
  async list(req: AuthRequest, res: Response) {
    try {
      const result = await rolesService.listRoles(req.user!.id)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const result = await rolesService.createRole(req.user!.id, req.body)
      res.status(201).json(result)
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.errorCode, message: error.message })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const result = await rolesService.updateRole(req.user!.id, req.params.role_id, req.body)
      res.status(200).json(result)
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.errorCode, message: error.message })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const result = await rolesService.deleteRole(req.user!.id, req.params.role_id)
      res.status(200).json(result)
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.errorCode, message: error.message })
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }
}

export const rolesController = new RolesController()
