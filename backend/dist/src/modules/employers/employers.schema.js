"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        full_name: zod_1.z.string().min(2, 'Full name is required'),
        phone: zod_1.z.string().optional(),
        student_id: zod_1.z.string().optional(),
        university: zod_1.z.string().optional(),
        role_id: zod_1.z.string().uuid().optional(),
    })
});
exports.updateEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        full_name: zod_1.z.string().min(2, 'Full name is required').optional(),
        phone: zod_1.z.string().optional(),
        student_id: zod_1.z.string().optional(),
        university: zod_1.z.string().optional(),
        role_id: zod_1.z.string().uuid().nullable().optional(),
    })
});
