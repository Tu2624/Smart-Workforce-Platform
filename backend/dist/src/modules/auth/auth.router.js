"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/register', (0, validate_middleware_1.validate)(auth_schema_1.registerEmployerSchema), auth_controller_1.authController.register);
router.post('/login', (0, validate_middleware_1.validate)(auth_schema_1.loginSchema), auth_controller_1.authController.login);
// Protected routes
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.authController.getMe);
router.put('/me', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(auth_schema_1.updateProfileSchema), auth_controller_1.authController.updateProfile);
router.put('/change-password', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(auth_schema_1.changePasswordSchema), auth_controller_1.authController.changePassword);
