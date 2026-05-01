"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersSchema = void 0;
const zod_1 = require("zod");
exports.listUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        role: zod_1.z.enum(['admin', 'employer', 'student']).optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    })
});
