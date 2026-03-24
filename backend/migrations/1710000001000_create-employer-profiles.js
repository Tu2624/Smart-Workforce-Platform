exports.up = (pgm) => {
  pgm.createTable('employer_profiles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    company_name: { type: 'varchar(255)', notNull: true },
    address: { type: 'text' },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
}

exports.down = (pgm) => { pgm.dropTable('employer_profiles') }
