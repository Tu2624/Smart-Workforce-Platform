'use strict'

exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE employer_roles (
      id          CHAR(36)     NOT NULL,
      employer_id CHAR(36)     NOT NULL,
      name        VARCHAR(100) NOT NULL,
      description VARCHAR(255) NULL,
      created_at  DATETIME     DEFAULT NOW(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_employer_role_name (employer_id, name),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS employer_roles;')
}

exports._meta = { version: 1 }
