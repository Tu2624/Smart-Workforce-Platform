'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE employer_profiles (
      id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      user_id       CHAR(36)     NOT NULL,
      company_name  VARCHAR(255) NOT NULL,
      address       TEXT,
      description   TEXT,
      created_at    DATETIME     DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS employer_profiles')
}
exports._meta = { version: 1 }
