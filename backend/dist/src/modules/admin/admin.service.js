"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const uuid_1 = require("uuid");
// @ts-ignore
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../../config/database"));
class AdminService {
    async getStats() {
        const [[userRow]] = await database_1.default.query('SELECT COUNT(*) as total FROM users');
        const [[jobRow]] = await database_1.default.query('SELECT COUNT(*) as total FROM jobs');
        const [[shiftRow]] = await database_1.default.query('SELECT COUNT(*) as total FROM shifts');
        const [[payrollRow]] = await database_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM payroll WHERE status = 'paid'`);
        return {
            total_users: Number(userRow.total),
            total_jobs: Number(jobRow.total),
            total_shifts: Number(shiftRow.total),
            total_payroll_paid: parseFloat(payrollRow.total),
        };
    }
    async listUsers(query) {
        const role = query.role;
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;
        let sql = 'SELECT id, email, full_name, role, phone, is_active, created_at FROM users';
        const params = [];
        if (role) {
            sql += ' WHERE role = ?';
            params.push(role);
        }
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await database_1.default.query(sql, params);
        const [countRows] = await database_1.default.query(role ? 'SELECT COUNT(*) as count FROM users WHERE role = ?' : 'SELECT COUNT(*) as count FROM users', role ? [role] : []);
        const total = countRows[0].count;
        return {
            users: rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async createEmployer(data) {
        const { email, full_name, password, phone, company_name } = data;
        const [existing] = await database_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0)
            throw new Error('EMAIL_TAKEN');
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const userId = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO users (id, email, password_hash, full_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)', [userId, email, hashed, full_name, 'employer', phone ?? null]);
        const profileId = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO employer_profiles (id, user_id, company_name) VALUES (?, ?, ?)', [profileId, userId, company_name ?? null]);
        return { id: userId, email, full_name, role: 'employer' };
    }
    async toggleUserStatus(userId) {
        const [rows] = await database_1.default.query('SELECT id, is_active FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user)
            throw new Error('USER_NOT_FOUND');
        await database_1.default.query('UPDATE users SET is_active = ? WHERE id = ?', [!user.is_active, userId]);
        return { is_active: !user.is_active };
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
