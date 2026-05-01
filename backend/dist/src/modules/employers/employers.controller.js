"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employersController = exports.EmployersController = void 0;
const employers_service_1 = require("./employers.service");
class EmployersController {
    async createEmployee(req, res) {
        try {
            const result = await employers_service_1.employersService.createEmployee(req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'EMAIL_ALREADY_EXISTS',
                    message: 'An account with this email already exists',
                });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async listEmployees(req, res) {
        try {
            const result = await employers_service_1.employersService.listEmployees(req.user.id);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async updateEmployee(req, res) {
        try {
            const result = await employers_service_1.employersService.updateEmployee(req.user.id, req.params.id, req.body);
            res.json(result);
        }
        catch (error) {
            const status = error.statusCode || 500;
            res.status(status).json({ error: error.code || 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async deleteEmployee(req, res) {
        try {
            const result = await employers_service_1.employersService.deleteEmployee(req.user.id, req.params.id);
            res.json(result);
        }
        catch (error) {
            const status = error.statusCode || 500;
            res.status(status).json({ error: error.code || 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async getStats(req, res) {
        try {
            const result = await employers_service_1.employersService.getStats(req.user.id);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async getChartData(req, res) {
        try {
            const result = await employers_service_1.employersService.getEmployerChartData(req.user.id);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
}
exports.EmployersController = EmployersController;
exports.employersController = new EmployersController();
