"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesController = exports.RolesController = void 0;
const roles_service_1 = require("./roles.service");
class RolesController {
    async list(req, res) {
        try {
            const result = await roles_service_1.rolesService.listRoles(req.user.id);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async create(req, res) {
        try {
            const result = await roles_service_1.rolesService.createRole(req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.errorCode, message: error.message });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async update(req, res) {
        try {
            const result = await roles_service_1.rolesService.updateRole(req.user.id, req.params.role_id, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.errorCode, message: error.message });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async remove(req, res) {
        try {
            const result = await roles_service_1.rolesService.deleteRole(req.user.id, req.params.role_id);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.errorCode, message: error.message });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
}
exports.RolesController = RolesController;
exports.rolesController = new RolesController();
