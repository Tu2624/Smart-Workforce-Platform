"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftsService = exports.ShiftsService = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const notificationHelper_1 = require("../../utils/notificationHelper");
const socket_1 = require("../../config/socket");
const reputationCalc_1 = require("../../utils/reputationCalc");
const appError_1 = require("../../utils/appError");
const shiftConflict_1 = require("../../utils/shiftConflict");
class ShiftsService {
    async createShift(employerId, data) {
        const { job_id, start_time, end_time, max_workers, title, auto_assign, role_id } = data;
        const [jobRows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [job_id]);
        const job = jobRows[0];
        if (!job)
            throw new Error('JOB_NOT_FOUND');
        if (job.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        if (role_id) {
            const [roleRows] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [role_id, employerId]);
            if (!roleRows.length)
                throw new Error('INVALID_ROLE_ID');
        }
        const shiftId = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO shifts (id, job_id, employer_id, title, start_time, end_time, max_workers, auto_assign, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [shiftId, job_id, employerId, title ?? null, start_time, end_time, max_workers, auto_assign ? 1 : 0, role_id ?? null]);
        return this.getShift(shiftId, 'employer');
    }
    async listShifts(role, userId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        if (role === 'employer') {
            conditions.push('s.employer_id = ?');
            values.push(userId);
            if (query.status) {
                conditions.push('s.status = ?');
                values.push(query.status);
            }
        }
        else if (role === 'student') {
            const [profileRows] = await database_1.default.query('SELECT employer_id, role_id FROM student_profiles WHERE user_id = ?', [userId]);
            const profile = profileRows[0] || {};
            const studentEmployerId = profile.employer_id || null;
            const studentRoleId = profile.role_id || null;
            conditions.push("j.status = 'active'");
            conditions.push('s.employer_id = ?');
            values.push(studentEmployerId);
            // Show open shifts + any shift the student has a non-cancelled registration for
            conditions.push(`(s.status = 'open' OR EXISTS (
        SELECT 1 FROM shift_registrations sr
        WHERE sr.shift_id = s.id AND sr.student_id = ? AND sr.status NOT IN ('cancelled')
      ))`);
            values.push(userId);
            // Role-based visibility: only show shifts matching student's role, or shifts with no role requirement
            if (studentRoleId) {
                conditions.push('(s.role_id IS NULL OR s.role_id = ?)');
                values.push(studentRoleId);
            }
        }
        // admin: no filter — return all shifts
        if (query.job_id) {
            conditions.push('s.job_id = ?');
            values.push(query.job_id);
        }
        if (query.date) {
            conditions.push('DATE(s.start_time) = ?');
            values.push(query.date);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [countRows] = await database_1.default.query(`SELECT COUNT(*) as total FROM shifts s LEFT JOIN jobs j ON s.job_id = j.id ${where}`, values);
        const total = countRows[0].total;
        const [rows] = await database_1.default.query(`SELECT s.*, j.title as job_title, j.hourly_rate, j.status as job_status,
              er.name as role_name
       FROM shifts s
       LEFT JOIN jobs j ON s.job_id = j.id
       LEFT JOIN employer_roles er ON s.role_id = er.id
       ${where}
       ORDER BY s.start_time ASC
       LIMIT ? OFFSET ?`, [...values, limit, offset]);
        const shifts = rows.map(s => this._parseShift(s));
        if (role === 'student' && shifts.length > 0) {
            const shiftIds = shifts.map(s => s.id);
            const [regRows] = await database_1.default.query("SELECT shift_id, status FROM shift_registrations WHERE student_id = ? AND shift_id IN (?) AND status != 'cancelled'", [userId, shiftIds]);
            const regMap = new Map(regRows.map(r => [r.shift_id, r.status]));
            return {
                shifts: shifts.map(s => ({ ...s, my_registration_status: regMap.get(s.id) ?? null })),
                pagination: { page, limit, total }
            };
        }
        return { shifts, pagination: { page, limit, total } };
    }
    async getShift(shiftId, role, userId) {
        const [rows] = await database_1.default.query(`SELECT s.*, j.title as job_title, j.hourly_rate, j.status as job_status, j.description as job_description,
              er.name as role_name
       FROM shifts s
       LEFT JOIN jobs j ON s.job_id = j.id
       LEFT JOIN employer_roles er ON s.role_id = er.id
       WHERE s.id = ?`, [shiftId]);
        const shift = rows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (role === 'student' && userId) {
            const [profileRows] = await database_1.default.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId]);
            const profile = profileRows[0];
            if (!profile || profile.employer_id.toLowerCase() !== shift.employer_id.toLowerCase()) {
                throw new Error('FORBIDDEN');
            }
        }
        const parsed = this._parseShift(shift);
        if (role === 'employer') {
            const [regRows] = await database_1.default.query('SELECT COUNT(*) as count FROM shift_registrations WHERE shift_id = ?', [shiftId]);
            parsed.registrations_count = regRows[0].count;
        }
        return { shift: parsed };
    }
    async updateShift(shiftId, employerId, data) {
        const [rows] = await database_1.default.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
        const shift = rows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (shift.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        if (shift.status !== 'open')
            throw new Error('CANNOT_EDIT_SHIFT');
        const { title, start_time, end_time, max_workers, auto_assign, role_id } = data;
        const updates = [];
        const values = [];
        if (role_id !== undefined) {
            if (role_id !== null) {
                const [roleRows] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [role_id, employerId]);
                if (!roleRows.length)
                    throw new Error('INVALID_ROLE_ID');
            }
            updates.push('role_id = ?');
            values.push(role_id ?? null);
        }
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (start_time !== undefined) {
            updates.push('start_time = ?');
            values.push(start_time);
        }
        if (end_time !== undefined) {
            updates.push('end_time = ?');
            values.push(end_time);
        }
        if (max_workers !== undefined) {
            updates.push('max_workers = ?');
            values.push(max_workers);
        }
        if (auto_assign !== undefined) {
            updates.push('auto_assign = ?');
            values.push(auto_assign ? 1 : 0);
        }
        if (updates.length === 0)
            return this.getShift(shiftId, 'employer');
        values.push(shiftId);
        await database_1.default.query(`UPDATE shifts SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getShift(shiftId, 'employer');
    }
    async cloneShift(shiftId, employerId, daysOffset = 7) {
        const [rows] = await database_1.default.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
        const shift = rows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (shift.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        if (shift.status === 'cancelled')
            throw new Error('CANNOT_CLONE_CANCELLED');
        const addDays = (dt) => new Date(dt.getTime() + daysOffset * 86400000);
        const newStart = addDays(new Date(shift.start_time));
        const newEnd = addDays(new Date(shift.end_time));
        const newId = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO shifts (id, job_id, employer_id, title, start_time, end_time, max_workers, auto_assign, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [newId, shift.job_id, employerId, shift.title ?? null, newStart, newEnd, shift.max_workers, shift.auto_assign, shift.role_id ?? null]);
        return this.getShift(newId, 'employer');
    }
    async deleteShift(shiftId, employerId) {
        const [rows] = await database_1.default.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
        const shift = rows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (shift.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        if (!['open', 'cancelled'].includes(shift.status))
            throw new Error('CANNOT_DELETE_SHIFT');
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            await connection.query('DELETE FROM shift_registrations WHERE shift_id = ?', [shiftId]);
            await connection.query('DELETE FROM shifts WHERE id = ?', [shiftId]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        return { message: 'Shift deleted successfully' };
    }
    async registerShift(shiftId, studentId) {
        const [profileRows] = await database_1.default.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [studentId]);
        const profile = profileRows[0];
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            const [shiftRows] = await connection.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
            const shift = shiftRows[0];
            if (!shift)
                throw new Error('SHIFT_NOT_FOUND');
            if (shift.status === 'cancelled' || shift.status === 'completed')
                throw new Error('SHIFT_NOT_OPEN');
            if (!profile || profile.employer_id.toLowerCase() !== shift.employer_id.toLowerCase())
                throw new Error('FORBIDDEN');
            // Real-time conflict check: reject immediately if student has an approved shift that overlaps
            const conflict = await (0, shiftConflict_1.hasApprovedConflict)(connection, studentId, new Date(shift.start_time), new Date(shift.end_time));
            if (conflict)
                throw new Error('SHIFT_TIME_CONFLICT');
            const regId = (0, uuid_1.v4)();
            await connection.query("INSERT INTO shift_registrations (id, shift_id, student_id, status) VALUES (?, ?, ?, 'pending')", [regId, shiftId, studentId]);
            await connection.commit();
            // Notify employer's shift room that a student registered
            const [userRows] = await database_1.default.query('SELECT full_name FROM users WHERE id = ?', [studentId]);
            const studentName = userRows[0]?.full_name || '';
            (0, socket_1.notifyShiftRoom)(shiftId, 'shift:registered', {
                shift_id: shiftId,
                student_id: studentId,
                student_name: studentName,
                registered_at: new Date().toISOString(),
            });
            return { message: 'Registration submitted successfully' };
        }
        catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY')
                throw new Error('ALREADY_REGISTERED');
            throw err;
        }
        finally {
            connection.release();
        }
    }
    async cancelRegistration(shiftId, studentId) {
        // Pre-fetch shift start_time before transaction to avoid timezone drift issues inside tx
        const [shiftRows] = await database_1.default.query('SELECT start_time FROM shifts WHERE id = ?', [shiftId]);
        const shiftStart = new Date(shiftRows[0]?.start_time);
        const hoursUntilStart = (shiftStart.getTime() - Date.now()) / 3600000;
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        let wasApproved = false;
        try {
            const [rows] = await connection.query("SELECT * FROM shift_registrations WHERE shift_id = ? AND student_id = ? AND status IN ('pending', 'approved')", [shiftId, studentId]);
            const reg = rows[0];
            if (!reg)
                throw new Error('REGISTRATION_NOT_FOUND');
            wasApproved = reg.status === 'approved';
            await connection.query("UPDATE shift_registrations SET status = 'cancelled' WHERE id = ?", [reg.id]);
            // Only decrement approved slot count — pending registrations don't affect current_workers
            if (wasApproved) {
                await connection.query(`UPDATE shifts SET
             current_workers = GREATEST(0, current_workers - 1),
             status = CASE WHEN status = 'full' THEN 'open' ELSE status END
           WHERE id = ?`, [shiftId]);
            }
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        // Adjust reputation after commit — runs outside tx so partial failure doesn't affect cancellation
        if (wasApproved && hoursUntilStart < 24) {
            await (0, reputationCalc_1.adjustReputation)(studentId, 'cancel_approved_late', `Hủy ca đã duyệt trong vòng 24h: shift ${shiftId}`);
        }
        return { message: 'Registration cancelled successfully' };
    }
    async listRegistrations(shiftId, employerId) {
        const [shiftRows] = await database_1.default.query('SELECT employer_id FROM shifts WHERE id = ?', [shiftId]);
        const shift = shiftRows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (shift.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        const [rows] = await database_1.default.query(`SELECT sr.*, u.full_name, u.email, sp.reputation_score, sp.university, sp.student_id as student_code
       FROM shift_registrations sr
       JOIN users u ON sr.student_id = u.id
       LEFT JOIN student_profiles sp ON sp.user_id = sr.student_id
       WHERE sr.shift_id = ? ORDER BY sp.reputation_score DESC, sr.registered_at ASC`, [shiftId]);
        return { registrations: rows };
    }
    async reviewRegistration(shiftId, regId, employerId, status) {
        const [shiftRows] = await database_1.default.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
        const shift = shiftRows[0];
        if (!shift)
            throw new Error('SHIFT_NOT_FOUND');
        if (shift.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        const [regRows] = await database_1.default.query('SELECT * FROM shift_registrations WHERE id = ? AND shift_id = ?', [regId, shiftId]);
        const reg = regRows[0];
        if (!reg)
            throw new Error('REGISTRATION_NOT_FOUND');
        if (reg.status !== 'pending')
            throw new Error('ALREADY_REVIEWED');
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            if (status === 'approved') {
                const [updateResult] = await connection.query(`UPDATE shifts 
           SET current_workers = current_workers + 1, 
               status = CASE WHEN current_workers + 1 >= max_workers THEN 'full' ELSE 'open' END
           WHERE id = ? AND current_workers < max_workers AND status = 'open'`, [shiftId]);
                if (updateResult.affectedRows === 0) {
                    throw new appError_1.AppError(400, 'Ca làm việc đã đầy hoặc không còn mở', 'SHIFT_FULL_OR_CLOSED');
                }
            }
            await connection.query('UPDATE shift_registrations SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?', [status, employerId, regId]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        // Notify student
        const [shiftDetail] = await database_1.default.query('SELECT title, start_time FROM shifts WHERE id = ?', [shiftId]);
        const shiftInfo = shiftDetail[0];
        if (status === 'approved') {
            await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_approved', 'Đăng ký ca làm được duyệt', `Ca ${shiftInfo?.title || ''} ngày ${new Date(shiftInfo?.start_time).toLocaleDateString('vi-VN')} đã được chấp nhận.`, { shift_id: shiftId, registration_id: regId });
            (0, socket_1.notifyUser)(reg.student_id, 'shift:approved', { shift_id: shiftId, registration_id: regId });
        }
        else {
            await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối', `Ca ${shiftInfo?.title || ''} ngày ${new Date(shiftInfo?.start_time).toLocaleDateString('vi-VN')} đã bị từ chối.`, { shift_id: shiftId, registration_id: regId });
            (0, socket_1.notifyUser)(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: regId });
        }
        const [updated] = await database_1.default.query('SELECT * FROM shift_registrations WHERE id = ?', [regId]);
        return { registration: updated[0] };
    }
    async getStudentDashboardStats(studentId) {
        const [rows] = await database_1.default.query(`SELECT COUNT(*) as upcoming FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       WHERE sr.student_id = ? AND sr.status IN ('pending', 'approved') AND s.start_time > NOW()`, [studentId]);
        const [[payrollRow]] = await database_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) as monthly_earnings FROM payroll
       WHERE student_id = ? AND period_start = DATE_FORMAT(NOW(), '%Y-%m-01')`, [studentId]);
        return {
            upcoming_shifts: Number(rows[0].upcoming),
            monthly_earnings: parseFloat(payrollRow.monthly_earnings),
        };
    }
    async getStudentChartData(studentId) {
        // 6-month earnings trend
        const [earnRows] = await database_1.default.query(`SELECT DATE_FORMAT(period_start, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as earnings
       FROM payroll
       WHERE student_id = ? AND period_start >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 MONTH), '%Y-%m-01')
       GROUP BY month ORDER BY month ASC`, [studentId]);
        // Shift status breakdown (all time)
        const [statusRows] = await database_1.default.query(`SELECT sr.status, COUNT(*) as cnt
       FROM shift_registrations sr
       WHERE sr.student_id = ?
       GROUP BY sr.status`, [studentId]);
        const statusLabelMap = {
            approved: 'Đã duyệt',
            pending: 'Đang chờ',
            rejected: 'Bị từ chối',
            cancelled: 'Đã hủy',
        };
        return {
            earningsTrend: earnRows.map((r) => ({ month: r.month, earnings: parseFloat(r.earnings) })),
            statusBreakdown: statusRows.map((r) => ({
                name: statusLabelMap[r.status] ?? r.status,
                value: Number(r.cnt),
            })),
        };
    }
    _parseShift(shift) {
        return {
            ...shift,
            auto_assign: Boolean(shift.auto_assign),
            hourly_rate: shift.hourly_rate ? parseFloat(shift.hourly_rate) : null,
            job: shift.job_title ? {
                id: shift.job_id,
                title: shift.job_title,
                hourly_rate: shift.hourly_rate ? parseFloat(shift.hourly_rate) : null,
                status: shift.job_status,
                description: shift.job_description,
            } : undefined,
        };
    }
}
exports.ShiftsService = ShiftsService;
exports.shiftsService = new ShiftsService();
