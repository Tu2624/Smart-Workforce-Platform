'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE attendance (
      id                CHAR(36)   PRIMARY KEY DEFAULT (UUID()),
      shift_id          CHAR(36)   NOT NULL,
      student_id        CHAR(36)   NOT NULL,
      check_in_time     DATETIME,
      check_out_time    DATETIME,
      status            ENUM('on_time', 'late', 'absent', 'incomplete', 'pending') DEFAULT 'pending',
      late_minutes      INT        DEFAULT 0,
      early_minutes     INT        DEFAULT 0,
      hours_worked      DECIMAL(5,2),
      force_checkout    BOOLEAN    DEFAULT FALSE,
      force_checkout_by CHAR(36),
      note              TEXT,
      created_at        DATETIME   DEFAULT NOW(),
      FOREIGN KEY (shift_id)          REFERENCES shifts(id),
      FOREIGN KEY (student_id)        REFERENCES users(id),
      FOREIGN KEY (force_checkout_by) REFERENCES users(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS attendance')
}
exports._meta = { version: 1 }
