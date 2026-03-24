exports.up = (pgm) => {
  pgm.createTable('reputation_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    student_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    event_type: { type: 'varchar(50)' },
    delta: { type: 'decimal(5,2)' },
    reason: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
}

exports.down = (pgm) => { pgm.dropTable('reputation_events') }
