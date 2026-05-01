"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// @ts-ignore
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const appError_1 = require("../../utils/appError");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
class AuthService {
    async registerEmployer(data) {
        const { email, password, full_name, phone, company_name, address, description, industry } = data;
        const [existing] = await database_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            throw new appError_1.AppError(400, 'Email đã tồn tại', 'EMAIL_ALREADY_EXISTS');
        }
        const userId = (0, uuid_1.v4)();
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // Create user
            await connection.query('INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)', [userId, email, passwordHash, full_name, phone, 'employer']);
            // Create employer profile
            await connection.query('INSERT INTO employer_profiles (id, user_id, company_name, address, description, industry) VALUES (?, ?, ?, ?, ?, ?)', [(0, uuid_1.v4)(), userId, company_name, address, description, industry || null]);
            await connection.commit();
            const token = jsonwebtoken_1.default.sign({ id: userId, email, role: 'employer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const user = await this.getMe(userId, 'employer');
            return { user, token };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async login(email, password) {
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE email = ? AND is_active = true', [email]);
        const user = rows[0];
        if (!user || !(await bcryptjs_1.default.compare(password, user.password_hash))) {
            throw new appError_1.AppError(401, 'Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const userWithProfile = await this.getMe(user.id, user.role);
        return {
            token,
            user: userWithProfile
        };
    }
    async getMe(userId, role) {
        const [userRows] = await database_1.default.query('SELECT id, email, role, full_name, phone, avatar_url, created_at FROM users WHERE id = ?', [userId]);
        const user = userRows[0];
        if (!user)
            throw new Error('USER_NOT_FOUND');
        let profile = null;
        if (role === 'employer') {
            const [profileRows] = await database_1.default.query('SELECT * FROM employer_profiles WHERE user_id = ?', [userId]);
            profile = profileRows[0];
        }
        else if (role === 'student') {
            const [profileRows] = await database_1.default.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
            profile = profileRows[0];
        }
        return { ...user, profile };
    }
    async updateProfile(userId, role, data) {
        const { full_name, phone, avatar_url, ...profileData } = data;
        // Update user table
        if (full_name || phone || avatar_url) {
            const updates = [];
            const values = [];
            if (full_name) {
                updates.push('full_name = ?');
                values.push(full_name);
            }
            if (phone) {
                updates.push('phone = ?');
                values.push(phone);
            }
            if (avatar_url) {
                updates.push('avatar_url = ?');
                values.push(avatar_url);
            }
            if (updates.length > 0) {
                values.push(userId);
                await database_1.default.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
            }
        }
        // Update profile table
        if (Object.keys(profileData).length > 0) {
            if (role === 'employer') {
                const { company_name, address, description, industry } = profileData;
                const updates = [];
                const values = [];
                if (company_name) {
                    updates.push('company_name = ?');
                    values.push(company_name);
                }
                if (address) {
                    updates.push('address = ?');
                    values.push(address);
                }
                if (description) {
                    updates.push('description = ?');
                    values.push(description);
                }
                if (industry !== undefined) {
                    updates.push('industry = ?');
                    values.push(industry || null);
                }
                if (updates.length > 0) {
                    values.push(userId);
                    await database_1.default.query(`UPDATE employer_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            }
            else if (role === 'student') {
                const { student_id, university, skills } = profileData;
                const updates = [];
                const values = [];
                if (student_id) {
                    updates.push('student_id = ?');
                    values.push(student_id);
                }
                if (university) {
                    updates.push('university = ?');
                    values.push(university);
                }
                if (skills) {
                    updates.push('skills = ?');
                    values.push(JSON.stringify(skills));
                }
                if (updates.length > 0) {
                    values.push(userId);
                    await database_1.default.query(`UPDATE student_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            }
        }
        return this.getMe(userId, role);
    }
    async changePassword(userId, currentPass, newPass) {
        const [rows] = await database_1.default.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user || !(await bcryptjs_1.default.compare(currentPass, user.password_hash))) {
            throw new Error('INVALID_CURRENT_PASSWORD');
        }
        const newHash = await bcryptjs_1.default.hash(newPass, 10);
        await database_1.default.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
