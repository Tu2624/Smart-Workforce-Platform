exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true })
  pgm.createType('user_role', ['student', 'employer', 'admin'])
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    full_name: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(20)' },
    role: { type: 'user_role', notNull: true },
    avatar_url: { type: 'text' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('users')
  pgm.dropType('user_role')
}
