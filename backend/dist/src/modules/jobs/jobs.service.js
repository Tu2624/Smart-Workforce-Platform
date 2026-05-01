"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsService = exports.JobsService = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
class JobsService {
    async createJob(employerId, data) {
        const { title, hourly_rate, max_workers, description, required_skills } = data;
        const jobId = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO jobs (id, employer_id, title, description, hourly_rate, required_skills, max_workers) VALUES (?, ?, ?, ?, ?, ?, ?)', [jobId, employerId, title, description ?? null, hourly_rate, JSON.stringify(required_skills ?? []), max_workers]);
        const [rows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = rows[0];
        return { job: this._parseJob(job) };
    }
    async listJobs(role, userId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        if (role === 'employer') {
            conditions.push('employer_id = ?');
            values.push(userId);
        }
        else if (role === 'student') {
            const [profileRows] = await database_1.default.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId]);
            const studentEmployerId = profileRows[0]?.employer_id || null;
            conditions.push("status = 'active'");
            conditions.push('employer_id = ?');
            values.push(studentEmployerId);
        }
        if (query.status && role === 'employer') {
            conditions.push('status = ?');
            values.push(query.status);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [countRows] = await database_1.default.query(`SELECT COUNT(*) as total FROM jobs ${where}`, values);
        const total = countRows[0].total;
        const [rows] = await database_1.default.query(`SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, limit, offset]);
        return {
            jobs: rows.map(j => this._parseJob(j)),
            pagination: { page, limit, total }
        };
    }
    async getJob(jobId, role, userId) {
        const [rows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = rows[0];
        if (!job)
            throw new Error('JOB_NOT_FOUND');
        if (role === 'student' && userId) {
            const [profileRows] = await database_1.default.query('SELECT employer_id FROM student_profiles WHERE user_id = ?', [userId]);
            const profile = profileRows[0];
            if (!profile || profile.employer_id.toLowerCase() !== job.employer_id.toLowerCase()) {
                throw new Error('FORBIDDEN');
            }
        }
        return { job: this._parseJob(job) };
    }
    async updateJob(jobId, employerId, data) {
        const [rows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = rows[0];
        if (!job)
            throw new Error('JOB_NOT_FOUND');
        if (job.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        const { title, hourly_rate, max_workers, description, required_skills } = data;
        const updates = [];
        const values = [];
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (hourly_rate !== undefined) {
            updates.push('hourly_rate = ?');
            values.push(hourly_rate);
        }
        if (max_workers !== undefined) {
            updates.push('max_workers = ?');
            values.push(max_workers);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (required_skills !== undefined) {
            updates.push('required_skills = ?');
            values.push(JSON.stringify(required_skills));
        }
        if (updates.length === 0)
            return this.getJob(jobId);
        values.push(jobId);
        await database_1.default.query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getJob(jobId);
    }
    async updateJobStatus(jobId, employerId, status) {
        const [rows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = rows[0];
        if (!job)
            throw new Error('JOB_NOT_FOUND');
        if (job.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        await database_1.default.query('UPDATE jobs SET status = ? WHERE id = ?', [status, jobId]);
        return this.getJob(jobId);
    }
    async deleteJob(jobId, employerId) {
        const [rows] = await database_1.default.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = rows[0];
        if (!job)
            throw new Error('JOB_NOT_FOUND');
        if (job.employer_id !== employerId)
            throw new Error('FORBIDDEN');
        const [shiftRows] = await database_1.default.query("SELECT COUNT(*) as count FROM shifts WHERE job_id = ? AND status NOT IN ('cancelled')", [jobId]);
        if (shiftRows[0].count > 0)
            throw new Error('CANNOT_DELETE_JOB');
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            const [shiftIdRows] = await connection.query('SELECT id FROM shifts WHERE job_id = ?', [jobId]);
            const shiftIds = shiftIdRows.map(r => r.id);
            if (shiftIds.length > 0) {
                const [attRows] = await connection.query('SELECT id FROM attendance WHERE shift_id IN (?)', [shiftIds]);
                const attIds = attRows.map(r => r.id);
                if (attIds.length > 0) {
                    await connection.query('DELETE FROM payroll_items WHERE attendance_id IN (?)', [attIds]);
                }
                await connection.query('DELETE FROM payroll_items WHERE shift_id IN (?)', [shiftIds]);
                await connection.query('DELETE FROM attendance WHERE shift_id IN (?)', [shiftIds]);
            }
            await connection.query('DELETE FROM jobs WHERE id = ?', [jobId]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        return { message: 'Job deleted successfully' };
    }
    _parseJob(job) {
        return {
            ...job,
            hourly_rate: parseFloat(job.hourly_rate),
            required_skills: typeof job.required_skills === 'string'
                ? JSON.parse(job.required_skills)
                : (job.required_skills ?? []),
        };
    }
}
exports.JobsService = JobsService;
exports.jobsService = new JobsService();
