'use strict'

module.exports = {
  up: async (db) => {
    await db.runSql(`
      ALTER TABLE shifts
        ADD COLUMN role_id CHAR(36) NULL AFTER employer_id,
        ADD CONSTRAINT fk_shifts_role_id
          FOREIGN KEY (role_id) REFERENCES employer_roles(id) ON DELETE SET NULL
    `)
  },
  down: async (db) => {
    await db.runSql(`
      ALTER TABLE shifts
        DROP FOREIGN KEY fk_shifts_role_id
    `)
    await db.runSql(`
      ALTER TABLE shifts
        DROP COLUMN role_id
    `)
  }
}
