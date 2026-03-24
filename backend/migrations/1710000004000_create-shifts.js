exports.up = (pgm) => {
  pgm.createType('shift_status', ['open', 'full', 'ongoing', 'completed', 'cancelled'])
  pgm.createTable('shifts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    job_id: { type: 'uuid', references: 'jobs(id)', onDelete: 'CASCADE', notNull: true },
    employer_id: { type: 'uuid', references: 'users(id)', notNull: true },
    title: { type: 'varchar(255)' },
    start_time: { type: 'timestamptz', notNull: true },
    end_time: { type: 'timestamptz', notNull: true },
    max_workers: { type: 'integer', notNull: true },
    current_workers: { type: 'integer', default: 0 },
    status: { type: 'shift_status', default: "'open'" },
    auto_assign: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
  pgm.createIndex('shifts', 'start_time')
  pgm.createIndex('shifts', 'employer_id')
}

exports.down = (pgm) => {
  pgm.dropTable('shifts')
  pgm.dropType('shift_status')
}
