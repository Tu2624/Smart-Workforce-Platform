'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE payroll (
      id           CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
      student_id   CHAR(36)      NOT NULL,
      employer_id  CHAR(36)      NOT NULL,
      period_start DATE          NOT NULL,
      period_end   DATE          NOT NULL,
      total_hours  DECIMAL(7,2),
      total_amount DECIMAL(12,2),
      status       ENUM('draft', 'confirmed', 'paid') DEFAULT 'draft',
      paid_at      DATETIME,
      created_at   DATETIME      DEFAULT NOW(),
      FOREIGN KEY (student_id)  REFERENCES users(id),
      FOREIGN KEY (employer_id) REFERENCES users(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS payroll')
}
exports._meta = { version: 1 }
