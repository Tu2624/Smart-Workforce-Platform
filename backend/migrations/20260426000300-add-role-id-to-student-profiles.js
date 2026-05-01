'use strict'

exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE student_profiles
      ADD COLUMN role_id CHAR(36) NULL AFTER employer_id,
      ADD CONSTRAINT fk_student_profiles_role_id
        FOREIGN KEY (role_id) REFERENCES employer_roles(id) ON DELETE SET NULL;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE student_profiles
      DROP FOREIGN KEY fk_student_profiles_role_id,
      DROP COLUMN role_id;
  `)
}

exports._meta = { version: 1 }
