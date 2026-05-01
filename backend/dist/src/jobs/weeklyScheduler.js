"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWeeklyScheduler = runWeeklyScheduler;
exports.startWeeklyScheduler = startWeeklyScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const notificationHelper_1 = require("../utils/notificationHelper");
const socket_1 = require("../config/socket");
const serverTime_1 = require("../utils/serverTime");
const shiftConflict_1 = require("../utils/shiftConflict");
async function runWeeklyScheduler() {
    console.log('[Scheduler] Running weekly shift assignment...');
    // Get all pending registrations for shifts starting this week
    const now = (0, serverTime_1.getNow)();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 1); // Include 1 day ago to be safe
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    console.log(`[Scheduler] Scanning shifts between ${weekStart.toISOString()} and ${weekEnd.toISOString()}`);
    const [pendingRows] = await database_1.default.query(`SELECT sr.*, sp.reputation_score, s.max_workers, s.current_workers, s.start_time, s.end_time, s.employer_id
     FROM shift_registrations sr
     JOIN shifts s ON sr.shift_id = s.id
     JOIN student_profiles sp ON sp.user_id = sr.student_id
     WHERE sr.status = 'pending' AND s.start_time BETWEEN ? AND ? AND s.status != 'cancelled'
     ORDER BY sr.shift_id, sp.reputation_score DESC, sr.registered_at ASC`, [weekStart, weekEnd]);
    console.log(`[Scheduler] Found ${pendingRows.length} pending registrations to process.`);
    // Group by shift
    const byShift = new Map();
    for (const row of pendingRows) {
        if (!byShift.has(row.shift_id))
            byShift.set(row.shift_id, []);
        byShift.get(row.shift_id).push(row);
    }
    for (const [shiftId, regs] of byShift) {
        const shift = regs[0];
        const availableSlots = shift.max_workers - shift.current_workers;
        let approved = 0;
        const connection = await database_1.default.getConnection();
        try {
            await connection.beginTransaction();
            for (const reg of regs) {
                if (approved >= availableSlots) {
                    await connection.query("UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?", [reg.id]);
                    await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối', `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} không được xếp do hết chỗ.`, { shift_id: shiftId, registration_id: reg.id });
                    (0, socket_1.notifyUser)(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id });
                    continue;
                }
                // Block students with reputation score < 50 from auto-assign
                if (reg.reputation_score < 50) {
                    await connection.query("UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?", [reg.id]);
                    await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối', `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} bị từ chối do điểm uy tín dưới 50.`, { shift_id: shiftId, registration_id: reg.id });
                    (0, socket_1.notifyUser)(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id });
                    continue;
                }
                // Check time conflict using DB query — correctly detects conflicts across all shifts,
                // including those approved earlier in this same transaction (same connection = sees own writes)
                const hasConflict = await (0, shiftConflict_1.hasApprovedConflict)(connection, reg.student_id, new Date(reg.start_time), new Date(reg.end_time), reg.shift_id);
                if (hasConflict) {
                    await connection.query("UPDATE shift_registrations SET status = 'rejected', reviewed_at = NOW() WHERE id = ?", [reg.id]);
                    await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_rejected', 'Đăng ký ca làm bị từ chối', `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} bị từ chối do trùng lịch.`, { shift_id: shiftId, registration_id: reg.id });
                    (0, socket_1.notifyUser)(reg.student_id, 'shift:rejected', { shift_id: shiftId, registration_id: reg.id });
                    continue;
                }
                await connection.query("UPDATE shift_registrations SET status = 'approved', reviewed_at = NOW() WHERE id = ?", [reg.id]);
                approved++;
                await (0, notificationHelper_1.createNotification)(reg.student_id, 'shift_approved', 'Đăng ký ca làm được duyệt', `Ca ngày ${new Date(reg.start_time).toLocaleDateString('vi-VN')} đã được xếp lịch.`, { shift_id: shiftId, registration_id: reg.id });
                (0, socket_1.notifyUser)(reg.student_id, 'shift:approved', { shift_id: shiftId, registration_id: reg.id });
            }
            const newCount = shift.current_workers + approved;
            const newStatus = newCount >= shift.max_workers ? 'full' : 'open';
            await connection.query('UPDATE shifts SET current_workers = ?, status = ? WHERE id = ?', [newCount, newStatus, shiftId]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            console.error(`[Scheduler] Error processing shift ${shiftId}:`, err);
        }
        finally {
            connection.release();
        }
    }
    console.log('[Scheduler] Weekly assignment complete.');
}
function startWeeklyScheduler() {
    // Every Sunday at 12:00 — runs immediately after the registration deadline closes
    node_cron_1.default.schedule('0 12 * * 0', runWeeklyScheduler, { timezone: 'Asia/Ho_Chi_Minh' });
    console.log('[Scheduler] Weekly scheduler registered (Sun 12:00 ICT)');
}
