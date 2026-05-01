"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
    async list(req, res) {
        try {
            const result = await notification_service_1.notificationService.listNotifications(req.user.id, req.query);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async markRead(req, res) {
        try {
            const result = await notification_service_1.notificationService.markRead(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'NOT_FOUND')
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async markAllRead(req, res) {
        try {
            const result = await notification_service_1.notificationService.markAllRead(req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
