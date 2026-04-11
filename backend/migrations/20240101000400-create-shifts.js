'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE shifts (
      id              CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      job_id          CHAR(36)  NOT NULL,
      employer_id     CHAR(36)  NOT NULL,
      title           VARCHAR(255),
      start_time      DATETIME  NOT NULL,
      end_time        DATETIME  NOT NULL,
      max_workers     INT       NOT NULL,
      current_workers INT       DEFAULT 0,
      status          ENUM('open', 'full', 'ongoing', 'completed', 'cancelled') DEFAULT 'open',
      auto_assign     BOOLEAN   DEFAULT FALSE,
      created_at      DATETIME  DEFAULT NOW(),
      FOREIGN KEY (job_id)      REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS shifts')
}
exports._meta = { version: 1 }
