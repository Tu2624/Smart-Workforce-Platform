"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustReputation = adjustReputation;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const DELTAS = {
    on_time_checkin: +2.0,
    complete_shift: +3.0,
    good_rating: +5.0,
    late_minor: -2.0,
    late_major: -5.0,
    absent: -10.0,
    cancel_approved_late: -7.0,
    bad_rating: -8.0,
};
async function adjustReputation(studentId, eventType, reason) {
    const delta = DELTAS[eventType];
    if (delta === undefined)
        return;
    await database_1.default.query('INSERT INTO reputation_events (id, student_id, event_type, delta, reason) VALUES (?, ?, ?, ?, ?)', [(0, uuid_1.v4)(), studentId, eventType, delta, reason ?? null]);
    await database_1.default.query(`UPDATE student_profiles
     SET reputation_score = LEAST(200, GREATEST(0, reputation_score + ?))
     WHERE user_id = ?`, [delta, studentId]);
}
