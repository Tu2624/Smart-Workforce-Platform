exports.up = (pgm) => {
  pgm.createType('registration_status', ['pending', 'approved', 'rejected', 'cancelled'])
  pgm.createTable('shift_registrations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    shift_id: { type: 'uuid', references: 'shifts(id)', onDelete: 'CASCADE', notNull: true },
    student_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    status: { type: 'registration_status', default: "'pending'" },
    registered_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    reviewed_at: { type: 'timestamptz' },
    reviewed_by: { type: 'uuid', references: 'users(id)' },
  })
  pgm.addConstraint('shift_registrations', 'uniq_shift_student', 'UNIQUE(shift_id, student_id)')
}

exports.down = (pgm) => {
  pgm.dropTable('shift_registrations')
  pgm.dropType('registration_status')
}
