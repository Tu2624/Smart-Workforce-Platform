"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRatingSchema = void 0;
const zod_1 = require("zod");
exports.createRatingSchema = zod_1.z.object({
    body: zod_1.z.object({
        shift_id: zod_1.z.string().uuid(),
        student_id: zod_1.z.string().uuid(),
        score: zod_1.z.number().int().min(1).max(5),
        comment: zod_1.z.string().max(500).optional(),
    }),
});
