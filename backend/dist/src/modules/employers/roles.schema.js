"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Tên vị trí không được để trống').max(100),
        description: zod_1.z.string().max(255).optional(),
    })
});
exports.updateRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        description: zod_1.z.string().max(255).optional(),
    }),
    params: zod_1.z.object({
        role_id: zod_1.z.string().uuid(),
    })
});
