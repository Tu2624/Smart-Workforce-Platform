"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.registerEmployerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
    })
});
exports.registerEmployerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        full_name: zod_1.z.string().min(2, 'Full name is required'),
        phone: zod_1.z.string().optional(),
        company_name: zod_1.z.string().min(2, 'Company name is required'),
        address: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        industry: zod_1.z.string().max(100).optional()
    })
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        current_password: zod_1.z.string(),
        new_password: zod_1.z.string().min(8, 'New password must be at least 8 characters')
    })
});
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        full_name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        avatar_url: zod_1.z.string().url().optional(),
        // Employer fields
        company_name: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        industry: zod_1.z.string().max(100).optional(),
        // Student fields
        student_id: zod_1.z.string().optional(),
        university: zod_1.z.string().optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional()
    })
});
