exports.up = (pgm) => {
  pgm.createTable('notifications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    type: { type: 'varchar(50)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    body: { type: 'text' },
    is_read: { type: 'boolean', default: false },
    metadata: { type: 'jsonb' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
  pgm.createIndex('notifications', 'user_id')
  pgm.createIndex('notifications', 'is_read')
}

exports.down = (pgm) => { pgm.dropTable('notifications') }
