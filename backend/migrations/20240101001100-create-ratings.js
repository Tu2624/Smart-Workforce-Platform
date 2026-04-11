'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE ratings (
      id          CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      shift_id    CHAR(36)  NOT NULL,
      student_id  CHAR(36)  NOT NULL,
      employer_id CHAR(36)  NOT NULL,
      score       INT       NOT NULL CHECK (score BETWEEN 1 AND 5),
      comment     TEXT,
      created_at  DATETIME  DEFAULT NOW(),
      UNIQUE (shift_id, student_id),
      FOREIGN KEY (shift_id)    REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS ratings')
}
exports._meta = { version: 1 }
