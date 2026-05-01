'use strict'

exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE employer_profiles
      ADD COLUMN industry VARCHAR(100) NULL AFTER description;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE employer_profiles DROP COLUMN industry;
  `)
}

exports._meta = { version: 1 }
