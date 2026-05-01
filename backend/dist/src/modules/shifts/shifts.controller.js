"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftsController = exports.ShiftsController = void 0;
const shifts_service_1 = require("./shifts.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const appError_1 = require("../../utils/appError");
class ShiftsController {
    create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.createShift(req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === 'JOB_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN');
            throw err;
        }
    });
    list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await shifts_service_1.shiftsService.listShifts(req.user.role, req.user.id, req.query);
        res.status(200).json(result);
    });
    getOne = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.getShift(req.params.id, req.user.role, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không có quyền truy cập ca làm việc này', 'FORBIDDEN');
            throw err;
        }
    });
    update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.updateShift(req.params.id, req.user.id, req.body);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN');
            if (err.message === 'CANNOT_EDIT_SHIFT')
                throw new appError_1.AppError(400, "Chỉ có thể chỉnh sửa ca làm việc ở trạng thái 'mở'", 'CANNOT_EDIT_SHIFT');
            throw err;
        }
    });
    clone = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const daysOffset = parseInt(req.body.days_offset) || 7;
            const result = await shifts_service_1.shiftsService.cloneShift(req.params.id, req.user.id, daysOffset);
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN');
            if (err.message === 'CANNOT_CLONE_CANCELLED')
                throw new appError_1.AppError(400, 'Không thể sao chép ca đã huỷ', 'CANNOT_CLONE_CANCELLED');
            throw err;
        }
    });
    remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.deleteShift(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN');
            if (err.message === 'CANNOT_DELETE_SHIFT')
                throw new appError_1.AppError(400, 'Chỉ có thể xóa ca ở trạng thái mở hoặc đã huỷ', 'CANNOT_DELETE_SHIFT');
            throw err;
        }
    });
    listRegistrations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.listRegistrations(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu ca làm việc này', 'FORBIDDEN');
            throw err;
        }
    });
    reviewRegistration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.reviewRegistration(req.params.id, req.params.reg_id, req.user.id, req.body.status);
            res.status(200).json(result);
        }
        catch (err) {
            const map = {
                SHIFT_NOT_FOUND: [404, 'Không tìm thấy ca làm việc'],
                FORBIDDEN: [403, 'Bạn không sở hữu ca làm việc này'],
                REGISTRATION_NOT_FOUND: [404, 'Không tìm thấy đơn đăng ký'],
                ALREADY_REVIEWED: [409, 'Đơn đăng ký đã được duyệt trước đó'],
                SHIFT_FULL: [409, 'Ca làm việc đã đầy'],
            };
            const errorDetail = map[err.message];
            if (errorDetail) {
                throw new appError_1.AppError(errorDetail[0], errorDetail[1], err.message);
            }
            throw err;
        }
    });
    myStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await shifts_service_1.shiftsService.getStudentDashboardStats(req.user.id);
        res.status(200).json(result);
    });
    getChartData = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await shifts_service_1.shiftsService.getStudentChartData(req.user.id);
        res.status(200).json(result);
    });
    register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.registerShift(req.params.id, req.user.id);
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy ca làm việc', 'SHIFT_NOT_FOUND');
            if (err.message === 'SHIFT_NOT_OPEN')
                throw new appError_1.AppError(400, 'Ca làm việc này không mở đăng ký', 'SHIFT_NOT_OPEN');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không thể đăng ký ca làm việc bên ngoài công ty của mình', 'FORBIDDEN');
            if (err.message === 'SHIFT_FULL')
                throw new appError_1.AppError(409, 'Ca làm việc đã đầy', 'SHIFT_FULL');
            if (err.message === 'ALREADY_REGISTERED')
                throw new appError_1.AppError(409, 'Bạn đã đăng ký ca làm việc này rồi', 'ALREADY_REGISTERED');
            if (err.message === 'SHIFT_TIME_CONFLICT')
                throw new appError_1.AppError(409, 'Ca này trùng lịch với ca đã được duyệt của bạn', 'SHIFT_TIME_CONFLICT');
            throw err;
        }
    });
    cancelRegistration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await shifts_service_1.shiftsService.cancelRegistration(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'REGISTRATION_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy đơn đăng ký cho ca làm việc này', 'REGISTRATION_NOT_FOUND');
            throw err;
        }
    });
}
exports.ShiftsController = ShiftsController;
exports.shiftsController = new ShiftsController();
