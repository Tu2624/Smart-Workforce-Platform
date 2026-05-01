"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingsController = exports.RatingsController = void 0;
const ratings_service_1 = require("./ratings.service");
class RatingsController {
    async create(req, res) {
        try {
            const result = await ratings_service_1.ratingsService.createRating(req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === 'SHIFT_NOT_ELIGIBLE')
                return res.status(400).json({ error: 'SHIFT_NOT_ELIGIBLE', message: 'Ca chưa hoàn thành hoặc không thuộc bạn' });
            if (err.message === 'STUDENT_NOT_IN_SHIFT')
                return res.status(400).json({ error: 'STUDENT_NOT_IN_SHIFT', message: 'Sinh viên không tham gia ca này' });
            if (err.message === 'ALREADY_RATED')
                return res.status(409).json({ error: 'ALREADY_RATED', message: 'Đã đánh giá sinh viên này trong ca này rồi' });
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    async listByStudent(req, res) {
        try {
            const result = await ratings_service_1.ratingsService.listStudentRatings(req.params.studentId);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
}
exports.RatingsController = RatingsController;
exports.ratingsController = new RatingsController();
