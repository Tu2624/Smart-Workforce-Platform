'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE payroll_items (
      id                CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
      payroll_id        CHAR(36)      NOT NULL,
      shift_id          CHAR(36),
      attendance_id     CHAR(36),
      scheduled_hours   DECIMAL(5,2),
      hours_worked      DECIMAL(5,2),
      hourly_rate       DECIMAL(10,2),
      deduction_minutes INT           DEFAULT 0,
      deduction_amount  DECIMAL(12,2) DEFAULT 0,
      subtotal          DECIMAL(12,2),
      FOREIGN KEY (payroll_id)    REFERENCES payroll(id) ON DELETE CASCADE,
      FOREIGN KEY (shift_id)      REFERENCES shifts(id),
      FOREIGN KEY (attendance_id) REFERENCES attendance(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS payroll_items')
}
exports._meta = { version: 1 }
