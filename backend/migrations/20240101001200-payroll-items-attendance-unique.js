'use strict'

module.exports = {
  up: async (db) => {
    await db.runSql(`
      ALTER TABLE payroll_items
        ADD UNIQUE KEY uq_payroll_items_attendance_id (attendance_id)
    `)
  },
  down: async (db) => {
    await db.runSql(`
      ALTER TABLE payroll_items
        DROP INDEX uq_payroll_items_attendance_id
    `)
  },
}
