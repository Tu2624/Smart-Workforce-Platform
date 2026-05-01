"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    async getStats(req, res) {
        try {
            const result = await admin_service_1.adminService.getStats();
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async listUsers(req, res) {
        try {
            const result = await admin_service_1.adminService.listUsers(req.query);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async createEmployer(req, res) {
        try {
            const result = await admin_service_1.adminService.createEmployer(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === 'EMAIL_TAKEN')
                return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email đã được sử dụng' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async toggleUserStatus(req, res) {
        try {
            const result = await admin_service_1.adminService.toggleUserStatus(req.params.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'USER_NOT_FOUND')
                return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
