"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class ReportsService {
    async getOverview(employerId) {
        const [[shiftRow]] = await database_1.default.query(`SELECT
         COUNT(*) AS total_shifts,
         COALESCE(AVG(CASE WHEN max_workers > 0 THEN current_workers / max_workers * 100 END), 0) AS fill_rate
       FROM shifts
       WHERE employer_id = ?
         AND status NOT IN ('cancelled')
         AND YEAR(start_time) = YEAR(CURDATE())
         AND MONTH(start_time) = MONTH(CURDATE())`, [employerId]);
        const [[hoursRow]] = await database_1.default.query(`SELECT COALESCE(SUM(a.hours_worked), 0) AS total_hours
       FROM attendance a
       JOIN shifts s ON a.shift_id = s.id
       WHERE s.employer_id = ?
         AND YEAR(s.start_time) = YEAR(CURDATE())
         AND MONTH(s.start_time) = MONTH(CURDATE())`, [employerId]);
        const [[costRow]] = await database_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) AS total_cost
       FROM payroll
       WHERE employer_id = ?
         AND period_start = DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [employerId]);
        const [[empRow]] = await database_1.default.query(`SELECT COUNT(*) AS total_employees FROM student_profiles WHERE employer_id = ?`, [employerId]);
        return {
            total_shifts: Number(shiftRow.total_shifts),
            fill_rate: Math.round(Number(shiftRow.fill_rate)),
            total_hours: parseFloat(hoursRow.total_hours),
            total_cost: parseFloat(costRow.total_cost),
            total_employees: Number(empRow.total_employees),
        };
    }
    async getPayrollSummary(employerId) {
        const [rows] = await database_1.default.query(`SELECT
         DATE_FORMAT(period_start, '%Y-%m') AS month,
         SUM(total_amount)                  AS total_amount,
         COUNT(DISTINCT student_id)         AS employee_count
       FROM payroll
       WHERE employer_id = ?
         AND period_start >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
       GROUP BY DATE_FORMAT(period_start, '%Y-%m')
       ORDER BY month ASC`, [employerId]);
        return {
            months: rows.map(r => ({
                month: r.month,
                total_amount: parseFloat(r.total_amount),
                employee_count: Number(r.employee_count),
            })),
        };
    }
    async getPerformance(employerId) {
        const [rows] = await database_1.default.query(`SELECT
         u.id,
         u.full_name,
         sp.reputation_score,
         COUNT(a.id)                                                         AS total_shifts,
         SUM(CASE WHEN a.status = 'on_time'    THEN 1 ELSE 0 END)           AS on_time_count,
         SUM(CASE WHEN a.status = 'late'       THEN 1 ELSE 0 END)           AS late_count,
         SUM(CASE WHEN a.status = 'absent'     THEN 1 ELSE 0 END)           AS absent_count,
         SUM(CASE WHEN a.status = 'incomplete' THEN 1 ELSE 0 END)           AS incomplete_count,
         COALESCE(SUM(a.hours_worked), 0)                                   AS total_hours
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id AND sp.employer_id = ?
       LEFT JOIN attendance a ON a.student_id = u.id
       LEFT JOIN shifts s ON s.id = a.shift_id AND s.employer_id = ?
       WHERE u.is_active = true
       GROUP BY u.id, u.full_name, sp.reputation_score
       ORDER BY total_shifts DESC, sp.reputation_score DESC`, [employerId, employerId]);
        return {
            employees: rows.map(r => ({
                id: r.id,
                full_name: r.full_name,
                reputation_score: parseFloat(r.reputation_score) || 100,
                total_shifts: Number(r.total_shifts),
                on_time_count: Number(r.on_time_count),
                late_count: Number(r.late_count),
                absent_count: Number(r.absent_count),
                incomplete_count: Number(r.incomplete_count),
                total_hours: parseFloat(r.total_hours),
                on_time_rate: Number(r.total_shifts) > 0
                    ? Math.round((Number(r.on_time_count) / Number(r.total_shifts)) * 100)
                    : 0,
            })),
        };
    }
    async getShiftStats(employerId) {
        const [rows] = await database_1.default.query(`SELECT
         DATE(start_time)                                                  AS date,
         COUNT(*)                                                          AS total,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)            AS completed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)            AS cancelled,
         SUM(CASE WHEN status NOT IN ('cancelled','completed') THEN 1 ELSE 0 END) AS upcoming
       FROM shifts
       WHERE employer_id = ?
         AND start_time >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE(start_time)
       ORDER BY date ASC`, [employerId]);
        return {
            stats: rows.map(r => ({
                date: r.date,
                total: Number(r.total),
                completed: Number(r.completed),
                cancelled: Number(r.cancelled),
                upcoming: Number(r.upcoming),
            })),
        };
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
