"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasApprovedConflict = hasApprovedConflict;
/**
 * Returns true if the student has any APPROVED shift_registration
 * whose shift overlaps [start, end) using the standard half-open interval formula:
 *   existing.start_time < end  AND  existing.end_time > start
 *
 * Pass a transaction connection (not the pool) when calling from inside a transaction
 * so the query sees uncommitted writes made earlier in the same transaction.
 */
async function hasApprovedConflict(conn, studentId, start, end, excludeShiftId) {
    const excludeClause = excludeShiftId ? 'AND s.id != ?' : '';
    const values = [studentId, end, start];
    if (excludeShiftId)
        values.push(excludeShiftId);
    const [rows] = await conn.query(`SELECT 1
     FROM shift_registrations sr
     JOIN shifts s ON s.id = sr.shift_id
     WHERE sr.student_id = ?
       AND sr.status = 'approved'
       AND s.start_time < ?
       AND s.end_time   > ?
       ${excludeClause}
     LIMIT 1`, values);
    return rows.length > 0;
}
