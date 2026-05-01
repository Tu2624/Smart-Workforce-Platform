"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const socket_1 = require("./config/socket");
const auth_router_1 = require("./modules/auth/auth.router");
const employers_router_1 = require("./modules/employers/employers.router");
const jobs_router_1 = require("./modules/jobs/jobs.router");
const shifts_router_1 = require("./modules/shifts/shifts.router");
const admin_router_1 = require("./modules/admin/admin.router");
const attendance_router_1 = require("./modules/attendance/attendance.router");
const payroll_router_1 = require("./modules/payroll/payroll.router");
const notification_router_1 = require("./modules/notification/notification.router");
const ratings_router_1 = require("./modules/ratings/ratings.router");
const reports_router_1 = require("./modules/reports/reports.router");
const dev_router_1 = require("./modules/dev/dev.router");
const weeklyScheduler_1 = require("./jobs/weeklyScheduler");
const autoDetectAbsent_1 = require("./jobs/autoDetectAbsent");
const lowRegistrationAlert_1 = require("./jobs/lowRegistrationAlert");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_router_1.authRouter);
app.use('/api/employers', employers_router_1.employersRouter);
app.use('/api/jobs', jobs_router_1.jobsRouter);
app.use('/api/shifts', shifts_router_1.shiftsRouter);
app.use('/api/admin', admin_router_1.adminRouter);
app.use('/api/attendance', attendance_router_1.attendanceRouter);
app.use('/api/payroll', payroll_router_1.payrollRouter);
app.use('/api/notifications', notification_router_1.notificationRouter);
app.use('/api/ratings', ratings_router_1.ratingsRouter);
app.use('/api/reports', reports_router_1.reportsRouter);
app.use('/api/dev', dev_router_1.devRouter);
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(err.stack);
    }
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'Something went wrong!';
    res.status(statusCode).json({
        error: errorCode,
        message: message,
    });
});
if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not set. Set it in .env before starting the server.');
    process.exit(1);
}
const PORT = process.env.PORT || 3001;
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        (0, weeklyScheduler_1.startWeeklyScheduler)();
        (0, autoDetectAbsent_1.startAbsentDetector)();
        (0, lowRegistrationAlert_1.startLowRegAlert)();
    });
}
exports.default = app;
