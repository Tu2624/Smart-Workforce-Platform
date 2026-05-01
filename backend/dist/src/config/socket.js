"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.notifyUser = notifyUser;
exports.notifyShiftRoom = notifyShiftRoom;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let io;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('Unauthorized'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.user = payload;
            next();
        }
        catch {
            next(new Error('Unauthorized'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user?.id;
        if (userId)
            socket.join(`user_${userId}`);
        socket.on('join:shift', ({ shift_id }) => socket.join(`shift_${shift_id}`));
    });
    return io;
}
function notifyUser(userId, event, data) {
    if (!io)
        return;
    io.to(`user_${userId}`).emit(event, data);
}
function notifyShiftRoom(shiftId, event, data) {
    if (!io)
        return;
    io.to(`shift_${shiftId}`).emit(event, data);
}
