"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceController = exports.AttendanceController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const attendance_service_1 = require("./attendance.service");
class AttendanceController {
    async checkIn(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.checkIn(req.user.id, req.body.shift_id);
            res.status(201).json(result);
        }
        catch (err) {
            const map = {
                NOT_REGISTERED: [403, 'You do not have an approved registration for this shift'],
                ALREADY_CHECKED_IN: [409, 'You have already checked in for this shift'],
                SHIFT_NOT_FOUND: [404, 'Shift not found'],
                TOO_EARLY: [400, 'Too early to check in (max 1h before start)'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async checkOut(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.checkOut(req.user.id, req.body.shift_id);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                ATTENDANCE_NOT_FOUND: [404, 'No active attendance record found'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async listMine(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.listStudentAttendance(req.user.id, req.query);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async listForShift(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.listShiftAttendance(req.params.shift_id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                SHIFT_NOT_FOUND: [404, 'Shift not found'],
                FORBIDDEN: [403, 'You do not own this shift'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async forceComplete(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.forceComplete(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                ATTENDANCE_NOT_FOUND: [404, 'Attendance record not found'],
                FORBIDDEN: [403, 'You do not own this shift'],
                ALREADY_COMPLETED: [409, 'Student has already checked out'],
                SHIFT_NOT_ENDED: [400, 'Shift has not ended yet'],
                FORCE_CHECKOUT_LIMIT_EXCEEDED: [403, 'Force checkout limit (3/month) exceeded for this student'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async manualCheckIn(req, res) {
        try {
            const { shift_id, student_id } = req.body;
            // Verify ownership
            const [shiftRows] = await database_1.default.query('SELECT employer_id FROM shifts WHERE id = ?', [shift_id]);
            const shift = shiftRows[0];
            if (!shift)
                throw new Error('SHIFT_NOT_FOUND');
            if (shift.employer_id !== req.user.id)
                throw new Error('FORBIDDEN');
            const result = await attendance_service_1.attendanceService.checkIn(student_id, shift_id);
            res.status(201).json(result);
        }
        catch (err) {
            const map = {
                NOT_REGISTERED: [403, 'Student does not have an approved registration'],
                ALREADY_CHECKED_IN: [409, 'Student has already checked in'],
                SHIFT_NOT_FOUND: [404, 'Shift not found'],
                TOO_EARLY: [400, 'Too early to check in (max 1h before start)'],
                FORBIDDEN: [403, 'You do not own this shift'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async manualCheckOut(req, res) {
        try {
            const { shift_id, student_id } = req.body;
            // Verify ownership
            const [shiftRows] = await database_1.default.query('SELECT employer_id FROM shifts WHERE id = ?', [shift_id]);
            const shift = shiftRows[0];
            if (!shift)
                throw new Error('SHIFT_NOT_FOUND');
            if (shift.employer_id !== req.user.id)
                throw new Error('FORBIDDEN');
            const result = await attendance_service_1.attendanceService.checkOut(student_id, shift_id);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                ATTENDANCE_NOT_FOUND: [404, 'No active attendance record found for this student'],
                FORBIDDEN: [403, 'You do not own this shift'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
    async updateNote(req, res) {
        try {
            const result = await attendance_service_1.attendanceService.updateNote(req.params.id, req.user.id, req.body.note);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                ATTENDANCE_NOT_FOUND: [404, 'Attendance record not found'],
                FORBIDDEN: [403, 'You do not own this shift'],
            };
            const [status, message] = map[err.message] ?? [500, err.message];
            res.status(status).json({ error: err.message, message });
        }
    }
}
exports.AttendanceController = AttendanceController;
exports.attendanceController = new AttendanceController();
