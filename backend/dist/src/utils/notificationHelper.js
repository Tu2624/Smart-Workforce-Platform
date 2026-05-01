"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const socket_1 = require("../config/socket");
async function createNotification(userId, type, title, body, metadata) {
    const id = (0, uuid_1.v4)();
    await database_1.default.query('INSERT INTO notifications (id, user_id, type, title, body, metadata) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, type, title, body, metadata ? JSON.stringify(metadata) : null]);
    (0, socket_1.notifyUser)(userId, 'notification:new', {
        id, type, title, body, metadata: metadata ?? null, is_read: false, created_at: new Date(),
    });
}
