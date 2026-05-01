"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobStatusSchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
exports.createJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        hourly_rate: zod_1.z.number().positive('Hourly rate must be positive'),
        max_workers: zod_1.z.number().int().positive('Max workers must be a positive integer'),
        description: zod_1.z.string().optional(),
        required_skills: zod_1.z.array(zod_1.z.string()).optional(),
    })
});
exports.updateJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        hourly_rate: zod_1.z.number().positive().optional(),
        max_workers: zod_1.z.number().int().positive().optional(),
        description: zod_1.z.string().optional(),
        required_skills: zod_1.z.array(zod_1.z.string()).optional(),
    })
});
exports.updateJobStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['active', 'paused', 'closed']),
    })
});
