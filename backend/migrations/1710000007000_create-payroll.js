exports.up = (pgm) => {
  pgm.createType('payroll_status', ['draft', 'confirmed', 'paid'])
  pgm.createTable('payroll', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    student_id: { type: 'uuid', references: 'users(id)', notNull: true },
    employer_id: { type: 'uuid', references: 'users(id)', notNull: true },
    period_start: { type: 'date', notNull: true },
    period_end: { type: 'date', notNull: true },
    total_hours: { type: 'decimal(7,2)' },
    base_amount: { type: 'decimal(12,2)' },
    bonus_amount: { type: 'decimal(12,2)', default: 0 },
    penalty_amount: { type: 'decimal(12,2)', default: 0 },
    total_amount: { type: 'decimal(12,2)' },
    status: { type: 'payroll_status', default: "'draft'" },
    paid_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
  pgm.createTable('payroll_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    payroll_id: { type: 'uuid', references: 'payroll(id)', onDelete: 'CASCADE', notNull: true },
    shift_id: { type: 'uuid', references: 'shifts(id)' },
    attendance_id: { type: 'uuid', references: 'attendance(id)' },
    hours_worked: { type: 'decimal(5,2)' },
    hourly_rate: { type: 'decimal(10,2)' },
    subtotal: { type: 'decimal(12,2)' },
    bonus: { type: 'decimal(12,2)', default: 0 },
    penalty: { type: 'decimal(12,2)', default: 0 },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('payroll_items')
  pgm.dropTable('payroll')
  pgm.dropType('payroll_status')
}
