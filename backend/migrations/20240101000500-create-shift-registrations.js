'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE shift_registrations (
      id            CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      shift_id      CHAR(36)  NOT NULL,
      student_id    CHAR(36)  NOT NULL,
      status        ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
      registered_at DATETIME  DEFAULT NOW(),
      reviewed_at   DATETIME,
      reviewed_by   CHAR(36),
      UNIQUE (shift_id, student_id),
      FOREIGN KEY (shift_id)    REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS shift_registrations')
}
exports._meta = { version: 1 }
