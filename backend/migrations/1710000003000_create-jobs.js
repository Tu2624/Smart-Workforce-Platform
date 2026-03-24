exports.up = (pgm) => {
  pgm.createType('job_status', ['active', 'paused', 'closed'])
  pgm.createTable('jobs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    employer_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    hourly_rate: { type: 'decimal(10,2)', notNull: true },
    required_skills: { type: 'text[]', default: "'{}'" },
    max_workers: { type: 'integer', notNull: true },
    status: { type: 'job_status', default: "'active'" },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('jobs')
  pgm.dropType('job_status')
}
