exports.up = (pgm) => {
  pgm.createType('attendance_status', ['on_time', 'late', 'absent', 'pending'])
  pgm.createTable('attendance', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    shift_id: { type: 'uuid', references: 'shifts(id)', notNull: true },
    student_id: { type: 'uuid', references: 'users(id)', notNull: true },
    check_in_time: { type: 'timestamptz' },
    check_out_time: { type: 'timestamptz' },
    status: { type: 'attendance_status', default: "'pending'" },
    late_minutes: { type: 'integer', default: 0 },
    hours_worked: { type: 'decimal(5,2)' },
    note: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
  pgm.addConstraint('attendance', 'uniq_shift_student_attendance', 'UNIQUE(shift_id, student_id)')
}

exports.down = (pgm) => {
  pgm.dropTable('attendance')
  pgm.dropType('attendance_status')
}
