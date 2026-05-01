"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
class ReportsController {
    async getOverview(req, res) {
        try {
            const result = await reports_service_1.reportsService.getOverview(req.user.id);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async getPayrollSummary(req, res) {
        try {
            const result = await reports_service_1.reportsService.getPayrollSummary(req.user.id);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async getPerformance(req, res) {
        try {
            const result = await reports_service_1.reportsService.getPerformance(req.user.id);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async getShiftStats(req, res) {
        try {
            const result = await reports_service_1.reportsService.getShiftStats(req.user.id);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
