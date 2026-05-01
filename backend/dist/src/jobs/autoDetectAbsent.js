"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAbsentDetector = startAbsentDetector;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const reputationCalc_1 = require("../utils/reputationCalc");
const notificationHelper_1 = require("../utils/notificationHelper");
const payroll_service_1 = require("../modules/payroll/payroll.service");
const uuid_1 = require("uuid");
async function detectAbsentees() {
    // Find approved registrations for shifts that started >30 min ago with no attendance record
    const [rows] = await database_1.default.query(`SELECT sr.student_id, sr.shift_id, s.start_time
     FROM shift_registrations sr
     JOIN shifts s ON sr.shift_id = s.id
     LEFT JOIN attendance a ON a.shift_id = sr.shift_id AND a.student_id = sr.student_id
     WHERE sr.status = 'approved'
       AND a.id IS NULL
       AND s.start_time <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       AND s.status NOT IN ('cancelled')`);
    for (const row of rows) {
        const id = (0, uuid_1.v4)();
        await database_1.default.query("INSERT IGNORE INTO attendance (id, shift_id, student_id, status, late_minutes, hours_worked) VALUES (?, ?, ?, 'absent', 0, 0)", [id, row.shift_id, row.student_id]);
        await (0, reputationCalc_1.adjustReputation)(row.student_id, 'absent', `Absent from shift ${row.shift_id}`);
        await (0, notificationHelper_1.createNotification)(row.student_id, 'absent_detected', 'Vắng mặt không phép', `Bạn đã không điểm danh ca làm ngày ${new Date(row.start_time).toLocaleDateString('vi-VN')}.`, { shift_id: row.shift_id });
        // Create zero-pay payroll item for absent attendance
        await (0, payroll_service_1.calcPayroll)(id);
    }
}
function startAbsentDetector() {
    // Every 30 minutes
    node_cron_1.default.schedule('*/30 * * * *', detectAbsentees, { timezone: 'Asia/Ho_Chi_Minh' });
    console.log('[AbsentDetector] Registered (every 30 min)');
}
