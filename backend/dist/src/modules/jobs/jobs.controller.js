"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsController = exports.JobsController = void 0;
const jobs_service_1 = require("./jobs.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const appError_1 = require("../../utils/appError");
class JobsController {
    create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await jobs_service_1.jobsService.createJob(req.user.id, req.body);
        res.status(201).json(result);
    });
    list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await jobs_service_1.jobsService.listJobs(req.user.role, req.user.id, req.query);
        res.status(200).json(result);
    });
    getOne = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await jobs_service_1.jobsService.getJob(req.params.id, req.user.role, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'JOB_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không có quyền truy cập công việc này', 'FORBIDDEN');
            throw err;
        }
    });
    update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await jobs_service_1.jobsService.updateJob(req.params.id, req.user.id, req.body);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'JOB_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN');
            throw err;
        }
    });
    updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await jobs_service_1.jobsService.updateJobStatus(req.params.id, req.user.id, req.body.status);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'JOB_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN');
            throw err;
        }
    });
    remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const result = await jobs_service_1.jobsService.deleteJob(req.params.id, req.user.id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === 'JOB_NOT_FOUND')
                throw new appError_1.AppError(404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
            if (err.message === 'FORBIDDEN')
                throw new appError_1.AppError(403, 'Bạn không sở hữu công việc này', 'FORBIDDEN');
            if (err.message === 'CANNOT_DELETE_JOB')
                throw new appError_1.AppError(400, 'Không thể xóa công việc có ca làm việc đang hoạt động', 'CANNOT_DELETE_JOB');
            throw err;
        }
    });
}
exports.JobsController = JobsController;
exports.jobsController = new JobsController();
