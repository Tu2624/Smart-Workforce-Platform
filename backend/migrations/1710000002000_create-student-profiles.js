exports.up = (pgm) => {
  pgm.createTable('student_profiles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    student_id: { type: 'varchar(50)' },
    university: { type: 'varchar(255)' },
    skills: { type: 'text[]', default: "'{}'" },
    reputation_score: { type: 'decimal(5,2)', default: 100.0 },
    total_shifts_done: { type: 'integer', default: 0 },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
}

exports.down = (pgm) => { pgm.dropTable('student_profiles') }
