'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE notifications (
      id         CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      user_id    CHAR(36)     NOT NULL,
      type       VARCHAR(50)  NOT NULL,
      title      VARCHAR(255) NOT NULL,
      body       TEXT,
      is_read    BOOLEAN      DEFAULT FALSE,
      metadata   JSON,
      created_at DATETIME     DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS notifications')
}
exports._meta = { version: 1 }
