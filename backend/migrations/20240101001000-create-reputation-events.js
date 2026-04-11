'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE reputation_events (
      id         CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      student_id CHAR(36)     NOT NULL,
      event_type VARCHAR(50),
      delta      DECIMAL(5,2),
      reason     TEXT,
      created_at DATETIME     DEFAULT NOW(),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS reputation_events')
}
exports._meta = { version: 1 }
