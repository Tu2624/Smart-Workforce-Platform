"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devRouter = void 0;
const express_1 = require("express");
const serverTime_1 = require("../../utils/serverTime");
const weeklyScheduler_1 = require("../../jobs/weeklyScheduler");
const router = (0, express_1.Router)();
exports.devRouter = router;
// Middleware: block in production
router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Dev endpoints are disabled in production.' });
        return;
    }
    next();
});
// GET /api/dev/time — trả về giờ server hiện tại (có offset)
router.get('/time', (req, res) => {
    const now = (0, serverTime_1.getNow)();
    res.json({
        server_time: now.toISOString(),
        offset_ms: (0, serverTime_1.getOffsetMs)(),
        offset_hours: (0, serverTime_1.getOffsetMs)() / 3600000,
        real_time: new Date().toISOString(),
    });
});
// POST /api/dev/time/offset — set offset (body: { offsetMs: number } hoặc { offsetHours: number })
router.post('/time/offset', (req, res) => {
    const { offsetMs, offsetHours } = req.body;
    const ms = offsetMs !== undefined ? Number(offsetMs) : Number(offsetHours ?? 0) * 3600000;
    if (isNaN(ms)) {
        res.status(400).json({ error: 'INVALID_OFFSET', message: 'offsetMs hoặc offsetHours phải là số.' });
        return;
    }
    (0, serverTime_1.setOffsetMs)(ms);
    res.json({
        message: `Offset đã được set thành ${ms / 3600000}h (${ms}ms)`,
        server_time: (0, serverTime_1.getNow)().toISOString(),
        offset_ms: ms,
        offset_hours: ms / 3600000,
    });
});
// DELETE /api/dev/time/offset — reset về 0
router.delete('/time/offset', (req, res) => {
    (0, serverTime_1.resetOffset)();
    res.json({ message: 'Offset đã reset về 0', server_time: (0, serverTime_1.getNow)().toISOString(), offset_ms: 0 });
});
// POST /api/dev/trigger-schedule — kích hoạt xếp ca thủ công
router.post('/trigger-schedule', async (req, res) => {
    try {
        await (0, weeklyScheduler_1.runWeeklyScheduler)();
        res.json({ message: 'Đã kích hoạt xếp ca tự động thành công.' });
    }
    catch (error) {
        res.status(500).json({ error: 'TRIGGER_FAILED', message: error.message });
    }
});
