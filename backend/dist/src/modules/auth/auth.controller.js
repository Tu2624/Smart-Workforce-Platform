"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    async register(req, res) {
        try {
            const result = await auth_service_1.authService.registerEmployer(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'EMAIL_ALREADY_EXISTS',
                    message: 'This email is already registered'
                });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.message === 'INVALID_CREDENTIALS') {
                return res.status(401).json({
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async getMe(req, res) {
        try {
            const result = await auth_service_1.authService.getMe(req.user.id, req.user.role);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const result = await auth_service_1.authService.updateProfile(req.user.id, req.user.role, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    async changePassword(req, res) {
        try {
            const { current_password, new_password } = req.body;
            await auth_service_1.authService.changePassword(req.user.id, current_password, new_password);
            res.status(200).json({ message: 'Password updated successfully' });
        }
        catch (error) {
            if (error.message === 'INVALID_CURRENT_PASSWORD') {
                return res.status(400).json({
                    error: 'INVALID_CURRENT_PASSWORD',
                    message: 'Current password is incorrect'
                });
            }
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
