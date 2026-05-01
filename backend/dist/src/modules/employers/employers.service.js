"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employersService = exports.EmployersService = void 0;
// @ts-ignore
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const appError_1 = require("../../utils/appError");
const TEMP_PASSWORD_LENGTH = 10;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateTempPassword() {
    let result = '';
    for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
        result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
    }
    return result;
}
class EmployersService {
    async createEmployee(employerId, data) {
        const { email, full_name, phone, student_id, university, role_id } = data;
        // Validate role_id belongs to this employer
        if (role_id) {
            const [roleRows] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [role_id, employerId]);
            if (!roleRows.length) {
                throw new appError_1.AppError(400, 'Vị trí không hợp lệ hoặc không thuộc doanh nghiệp này', 'INVALID_ROLE_ID');
            }
        }
        const tempPassword = generateTempPassword();
        const passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
        const userId = (0, uuid_1.v4)();
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            await connection.query('INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)', [userId, email, passwordHash, full_name, phone ?? null, 'student']);
            await connection.query('INSERT INTO student_profiles (id, user_id, employer_id, role_id, student_id, university) VALUES (?, ?, ?, ?, ?, ?)', [(0, uuid_1.v4)(), userId, employerId, role_id ?? null, student_id ?? null, university ?? null]);
            await connection.commit();
            return {
                message: 'Employee account created successfully',
                user: { id: userId, email, role: 'student' },
                temp_password: tempPassword,
            };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async listEmployees(employerId) {
        const [rows] = await database_1.default.query(`SELECT u.id, u.email, u.full_name, u.phone, u.created_at,
              sp.student_id, sp.university, sp.reputation_score, sp.skills,
              sp.role_id, er.name AS role_name
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN employer_roles er ON er.id = sp.role_id
       WHERE sp.employer_id = ? AND u.is_active = true
       ORDER BY u.created_at DESC`, [employerId]);
        return {
            employees: rows.map(e => ({
                ...e,
                skills: typeof e.skills === 'string' ? JSON.parse(e.skills) : (e.skills ?? []),
                reputation_score: e.reputation_score != null ? parseFloat(e.reputation_score) : 100,
            }))
        };
    }
    async updateEmployee(employerId, employeeId, data) {
        const [profileRows] = await database_1.default.query('SELECT sp.id FROM student_profiles sp WHERE sp.user_id = ? AND sp.employer_id = ?', [employeeId, employerId]);
        if (!profileRows.length)
            throw new appError_1.AppError(404, 'Không tìm thấy nhân viên', 'EMPLOYEE_NOT_FOUND');
        const { full_name, phone, student_id, university, role_id } = data;
        if (role_id !== undefined && role_id !== null) {
            const [roleRows] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [role_id, employerId]);
            if (!roleRows.length)
                throw new appError_1.AppError(400, 'Vị trí không hợp lệ', 'INVALID_ROLE_ID');
        }
        const userUpdates = [];
        const userValues = [];
        if (full_name !== undefined) {
            userUpdates.push('full_name = ?');
            userValues.push(full_name);
        }
        if (phone !== undefined) {
            userUpdates.push('phone = ?');
            userValues.push(phone ?? null);
        }
        if (userUpdates.length) {
            userValues.push(employeeId);
            await database_1.default.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userValues);
        }
        const profileUpdates = [];
        const profileValues = [];
        if (student_id !== undefined) {
            profileUpdates.push('student_id = ?');
            profileValues.push(student_id ?? null);
        }
        if (university !== undefined) {
            profileUpdates.push('university = ?');
            profileValues.push(university ?? null);
        }
        if (role_id !== undefined) {
            profileUpdates.push('role_id = ?');
            profileValues.push(role_id ?? null);
        }
        if (profileUpdates.length) {
            profileValues.push(employeeId, employerId);
            await database_1.default.query(`UPDATE student_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ? AND employer_id = ?`, profileValues);
        }
        return { message: 'Employee updated successfully' };
    }
    async deleteEmployee(employerId, employeeId) {
        const [profileRows] = await database_1.default.query('SELECT sp.id FROM student_profiles sp WHERE sp.user_id = ? AND sp.employer_id = ?', [employeeId, employerId]);
        if (!profileRows.length)
            throw new appError_1.AppError(404, 'Không tìm thấy nhân viên', 'EMPLOYEE_NOT_FOUND');
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // payroll_items cascade from payroll (ON DELETE CASCADE)
            await connection.query('DELETE FROM payroll WHERE student_id = ?', [employeeId]);
            // attendance has no cascade from users, must delete manually
            await connection.query('DELETE FROM attendance WHERE student_id = ?', [employeeId]);
            // deleting user cascades: student_profiles, shift_registrations, reputation_events, notifications, ratings
            await connection.query('DELETE FROM users WHERE id = ?', [employeeId]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        return { message: 'Employee deleted successfully' };
    }
    async getStats(employerId) {
        const [empRows] = await database_1.default.query(`SELECT COUNT(*) as count FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE sp.employer_id = ? AND u.is_active = true`, [employerId]);
        const employeeCount = empRows[0].count;
        const [shiftRows] = await database_1.default.query(`SELECT COUNT(*) as count FROM shifts WHERE employer_id = ? AND DATE(start_time) = CURDATE() AND status NOT IN ('cancelled')`, [employerId]);
        const todayShiftsCount = shiftRows[0].count;
        const [[payrollRow]] = await database_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM payroll
       WHERE employer_id = ? AND period_start = DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [employerId]);
        return {
            employees: Number(employeeCount),
            today_shifts: Number(todayShiftsCount),
            current_month_payroll: parseFloat(payrollRow.total),
        };
    }
    async getEmployerChartData(employerId) {
        // 7-day shift count
        const [shiftRows] = await database_1.default.query(`SELECT DATE(start_time) as date, COUNT(*) as count
       FROM shifts
       WHERE employer_id = ? AND start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND status != 'cancelled'
       GROUP BY date ORDER BY date ASC`, [employerId]);
        // Payroll by role for current month
        const [payrollRows] = await database_1.default.query(`SELECT COALESCE(er.name, 'Chưa phân loại') as role_name, SUM(p.total_amount) as total
       FROM payroll p
       JOIN student_profiles sp ON p.student_id = sp.user_id AND p.employer_id = sp.employer_id
       LEFT JOIN employer_roles er ON sp.role_id = er.id
       WHERE p.employer_id = ? AND p.period_start = DATE_FORMAT(NOW(), '%Y-%m-01')
       GROUP BY er.id, er.name`, [employerId]);
        // Prepare 7 days labels even if no shifts
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0, 10));
        }
        const shiftMap = new Map(shiftRows.map(r => [new Date(r.date).toISOString().slice(0, 10), r.count]));
        const weeklyShifts = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
            shifts: shiftMap.get(date) || 0
        }));
        return {
            weeklyShifts,
            payrollByRole: payrollRows.map(r => ({
                name: r.role_name,
                value: parseFloat(r.total)
            }))
        };
    }
}
exports.EmployersService = EmployersService;
exports.employersService = new EmployersService();
