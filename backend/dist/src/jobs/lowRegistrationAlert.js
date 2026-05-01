"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLowRegAlert = startLowRegAlert;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const socket_1 = require("../config/socket");
const notificationHelper_1 = require("../utils/notificationHelper");
async function runLowRegistrationAlert() {
    console.log('[LowRegAlert] Checking shifts with no approved registrations...');
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    // Find shifts next 7 days with 0 approved registrations
    const [rows] = await database_1.default.query(`SELECT s.id, s.title, s.max_workers, s.employer_id
     FROM shifts s
     LEFT JOIN shift_registrations sr ON s.id = sr.shift_id AND sr.status = 'approved'
     WHERE s.start_time BETWEEN ? AND ?
       AND s.status NOT IN ('cancelled', 'completed')
     GROUP BY s.id
     HAVING COUNT(sr.id) = 0`, [now.toISOString(), weekEnd.toISOString()]);
    const shifts = rows;
    for (const shift of shifts) {
        await (0, notificationHelper_1.createNotification)(shift.employer_id, 'shift_low_registration', 'Ca làm chưa có nhân viên', `Ca "${shift.title}" chưa có ai đăng ký được duyệt. Còn 1 giờ trước deadline đăng ký (12:00).`, { shift_id: shift.id, current_count: 0, max_workers: shift.max_workers });
        (0, socket_1.notifyUser)(shift.employer_id, 'shift:low_registration', {
            shift_id: shift.id,
            title: shift.title,
            current_count: 0,
            max_workers: shift.max_workers,
        });
    }
    console.log(`[LowRegAlert] Alerted ${shifts.length} shift(s).`);
}
function startLowRegAlert() {
    // Every Sunday at 11:00 AM ICT (1 hour before registration deadline noon)
    node_cron_1.default.schedule('0 11 * * 0', runLowRegistrationAlert, { timezone: 'Asia/Ho_Chi_Minh' });
    console.log('[LowRegAlert] Low registration alert registered (Sun 11:00 ICT)');
}
