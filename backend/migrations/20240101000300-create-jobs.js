'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE jobs (
      id              CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
      employer_id     CHAR(36)      NOT NULL,
      title           VARCHAR(255)  NOT NULL,
      description     TEXT,
      hourly_rate     DECIMAL(10,2) NOT NULL,
      required_skills JSON,
      max_workers     INT           NOT NULL,
      status          ENUM('active', 'paused', 'closed') DEFAULT 'active',
      created_at      DATETIME      DEFAULT NOW(),
      updated_at      DATETIME      DEFAULT NOW() ON UPDATE NOW(),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS jobs')
}
exports._meta = { version: 1 }
