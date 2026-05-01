"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingsService = exports.RatingsService = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const reputationCalc_1 = require("../../utils/reputationCalc");
class RatingsService {
    async createRating(employerId, data) {
        const { shift_id, student_id, score, comment } = data;
        // Shift phải completed và thuộc employer này
        const [shiftRows] = await database_1.default.query("SELECT id, status, employer_id FROM shifts WHERE id = ? AND employer_id = ? AND status = 'completed'", [shift_id, employerId]);
        if (shiftRows.length === 0)
            throw new Error('SHIFT_NOT_ELIGIBLE');
        // Student phải có approved registration trong shift này
        const [regRows] = await database_1.default.query("SELECT id FROM shift_registrations WHERE shift_id = ? AND student_id = ? AND status = 'approved'", [shift_id, student_id]);
        if (regRows.length === 0)
            throw new Error('STUDENT_NOT_IN_SHIFT');
        // Không được rating 2 lần cho cùng shift + student
        const [existing] = await database_1.default.query('SELECT id FROM ratings WHERE shift_id = ? AND student_id = ?', [shift_id, student_id]);
        if (existing.length > 0)
            throw new Error('ALREADY_RATED');
        const id = (0, uuid_1.v4)();
        await database_1.default.query('INSERT INTO ratings (id, shift_id, student_id, employer_id, score, comment) VALUES (?, ?, ?, ?, ?, ?)', [id, shift_id, student_id, employerId, score, comment ?? null]);
        // Cập nhật reputation
        if (score >= 4)
            await (0, reputationCalc_1.adjustReputation)(student_id, 'good_rating', `Đánh giá ${score} sao từ ca ${shift_id}`);
        else if (score <= 2)
            await (0, reputationCalc_1.adjustReputation)(student_id, 'bad_rating', `Đánh giá ${score} sao từ ca ${shift_id}`);
        const [rows] = await database_1.default.query('SELECT * FROM ratings WHERE id = ?', [id]);
        return { rating: rows[0] };
    }
    async listStudentRatings(studentId) {
        const [rows] = await database_1.default.query(`SELECT r.*, u.full_name AS employer_name, ep.company_name,
              s.title AS shift_title, s.start_time
       FROM ratings r
       JOIN users u ON u.id = r.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = r.employer_id
       LEFT JOIN shifts s ON s.id = r.shift_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`, [studentId]);
        return { ratings: rows };
    }
}
exports.RatingsService = RatingsService;
exports.ratingsService = new RatingsService();
