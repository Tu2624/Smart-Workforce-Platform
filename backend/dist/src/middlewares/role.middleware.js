"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Authentication required'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'You do not have permission to access this resource'
            });
        }
        next();
    };
};
exports.roleGuard = roleGuard;
