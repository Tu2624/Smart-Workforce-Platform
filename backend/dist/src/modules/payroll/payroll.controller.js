"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollController = exports.PayrollController = void 0;
const payroll_service_1 = require("./payroll.service");
class PayrollController {
    async listMine(req, res) {
        try {
            const result = await payroll_service_1.payrollService.listStudentPayroll(req.user.id, req.query);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async listEmployer(req, res) {
        try {
            const result = await payroll_service_1.payrollService.listEmployerPayroll(req.user.id, req.query);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async getDetail(req, res) {
        try {
            const result = await payroll_service_1.payrollService.getPayrollDetail(req.params.id, req.user.id, req.user.role);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'NOT_FOUND')
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' });
            if (err.message === 'FORBIDDEN')
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async confirm(req, res) {
        try {
            const result = await payroll_service_1.payrollService.updateStatus(req.params.id, req.user.id, 'confirmed');
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'NOT_FOUND')
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' });
            if (err.message === 'FORBIDDEN')
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
            if (err.message === 'INVALID_TRANSITION')
                return res.status(400).json({ error: 'INVALID_TRANSITION', message: 'Cannot confirm this payroll' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async exportExcel(req, res) {
        try {
            const buffer = await payroll_service_1.payrollService.exportExcel(req.params.id, req.user.id, req.user.role);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="payroll-${req.params.id}.xlsx"`);
            res.send(buffer);
        }
        catch (err) {
            if (err.message === 'NOT_FOUND')
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' });
            if (err.message === 'FORBIDDEN')
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async markPaid(req, res) {
        try {
            const result = await payroll_service_1.payrollService.updateStatus(req.params.id, req.user.id, 'paid');
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'NOT_FOUND')
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Payroll not found' });
            if (err.message === 'FORBIDDEN')
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
            if (err.message === 'INVALID_TRANSITION')
                return res.status(400).json({ error: 'INVALID_TRANSITION', message: 'Cannot mark this payroll as paid' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
}
exports.PayrollController = PayrollController;
exports.payrollController = new PayrollController();
