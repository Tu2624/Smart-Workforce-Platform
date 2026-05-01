"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class NotificationService {
    async listNotifications(userId, query) {
        const limit = parseInt(query.limit) || 20;
        const page = parseInt(query.page) || 1;
        const offset = (page - 1) * limit;
        const conditions = ['user_id = ?'];
        const params = [userId];
        if (query.is_read !== undefined) {
            conditions.push('is_read = ?');
            params.push(query.is_read === 'false' ? 0 : 1);
        }
        const where = `WHERE ${conditions.join(' AND ')}`;
        const [rows] = await database_1.default.query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const [countRows] = await database_1.default.query(`SELECT COUNT(*) as total FROM notifications ${where}`, params);
        const [unreadRows] = await database_1.default.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
        return {
            notifications: rows.map(n => ({
                ...n,
                metadata: n.metadata ? JSON.parse(n.metadata) : null,
            })),
            unread_count: Number(unreadRows[0].count),
            pagination: { page, limit, total: Number(countRows[0].total) },
        };
    }
    async markRead(notifId, userId) {
        const [rows] = await database_1.default.query('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [notifId, userId]);
        if (!rows.length)
            throw new Error('NOT_FOUND');
        await database_1.default.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId]);
        return { message: 'Marked as read' };
    }
    async markAllRead(userId) {
        await database_1.default.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
        return { message: 'All notifications marked as read' };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
