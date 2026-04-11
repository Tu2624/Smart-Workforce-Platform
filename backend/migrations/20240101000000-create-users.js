'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE users (
      id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(255) NOT NULL,
      phone         VARCHAR(20),
      role          ENUM('student', 'employer', 'admin') NOT NULL,
      avatar_url    TEXT,
      is_active     BOOLEAN      DEFAULT TRUE,
      created_at    DATETIME     DEFAULT NOW(),
      updated_at    DATETIME     DEFAULT NOW() ON UPDATE NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS users')
}
exports._meta = { version: 1 }
