'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE student_profiles (
      id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      user_id          CHAR(36)     NOT NULL,
      employer_id      CHAR(36),
      student_id       VARCHAR(50),
      university       VARCHAR(255),
      skills           JSON,
      reputation_score DECIMAL(5,2) DEFAULT 100.00,
      total_shifts_done INT         DEFAULT 0,
      created_at       DATETIME     DEFAULT NOW(),
      FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS student_profiles')
}
exports._meta = { version: 1 }
