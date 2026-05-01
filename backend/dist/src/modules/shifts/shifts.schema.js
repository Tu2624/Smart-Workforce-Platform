"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShiftSchema = exports.createShiftSchema = void 0;
const zod_1 = require("zod");
exports.createShiftSchema = zod_1.z.object({
    body: zod_1.z.object({
        job_id: zod_1.z.string().uuid('Invalid job ID'),
        start_time: zod_1.z.string().min(1, 'Start time is required'),
        end_time: zod_1.z.string().min(1, 'End time is required'),
        max_workers: zod_1.z.number().int().positive('Max workers must be a positive integer'),
        title: zod_1.z.string().optional(),
        auto_assign: zod_1.z.boolean().optional(),
        role_id: zod_1.z.string().uuid('Invalid role ID').optional(),
    }).refine(data => new Date(data.end_time) > new Date(data.start_time), {
        message: 'End time must be after start time',
        path: ['end_time'],
    })
});
exports.updateShiftSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        start_time: zod_1.z.string().optional(),
        end_time: zod_1.z.string().optional(),
        max_workers: zod_1.z.number().int().positive().optional(),
        auto_assign: zod_1.z.boolean().optional(),
        role_id: zod_1.z.string().uuid('Invalid role ID').nullable().optional(),
    }).refine(data => {
        if (data.start_time && data.end_time) {
            return new Date(data.end_time) > new Date(data.start_time);
        }
        return true;
    }, {
        message: 'End time must be after start time',
        path: ['end_time'],
    })
});
