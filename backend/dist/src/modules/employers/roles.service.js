"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesService = exports.RolesService = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const appError_1 = require("../../utils/appError");
class RolesService {
    async listRoles(employerId) {
        const [rows] = await database_1.default.query('SELECT * FROM employer_roles WHERE employer_id = ? ORDER BY created_at ASC', [employerId]);
        return { roles: rows };
    }
    async createRole(employerId, data) {
        const { name, description } = data;
        const id = (0, uuid_1.v4)();
        try {
            await database_1.default.query('INSERT INTO employer_roles (id, employer_id, name, description) VALUES (?, ?, ?, ?)', [id, employerId, name, description ?? null]);
        }
        catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new appError_1.AppError(409, 'Tên vị trí đã tồn tại trong công ty', 'ROLE_NAME_DUPLICATE');
            }
            throw err;
        }
        const [rows] = await database_1.default.query('SELECT * FROM employer_roles WHERE id = ?', [id]);
        return { role: rows[0] };
    }
    async updateRole(employerId, roleId, data) {
        const [existing] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [roleId, employerId]);
        if (!existing.length) {
            throw new appError_1.AppError(404, 'Không tìm thấy vị trí', 'ROLE_NOT_FOUND');
        }
        const { name, description } = data;
        const updates = [];
        const values = [];
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (updates.length) {
            values.push(roleId);
            try {
                await database_1.default.query(`UPDATE employer_roles SET ${updates.join(', ')} WHERE id = ?`, values);
            }
            catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    throw new appError_1.AppError(409, 'Tên vị trí đã tồn tại trong công ty', 'ROLE_NAME_DUPLICATE');
                }
                throw err;
            }
        }
        const [rows] = await database_1.default.query('SELECT * FROM employer_roles WHERE id = ?', [roleId]);
        return { role: rows[0] };
    }
    async deleteRole(employerId, roleId) {
        const [existing] = await database_1.default.query('SELECT id FROM employer_roles WHERE id = ? AND employer_id = ?', [roleId, employerId]);
        if (!existing.length) {
            throw new appError_1.AppError(404, 'Không tìm thấy vị trí', 'ROLE_NOT_FOUND');
        }
        // ON DELETE SET NULL handles student_profiles.role_id automatically
        await database_1.default.query('DELETE FROM employer_roles WHERE id = ?', [roleId]);
        return { message: 'Đã xóa vị trí thành công' };
    }
}
exports.RolesService = RolesService;
exports.rolesService = new RolesService();
