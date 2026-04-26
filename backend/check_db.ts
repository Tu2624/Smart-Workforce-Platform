import 'dotenv/config'
import mysql from 'mysql2/promise'

async function check() {
  const configs = [
    { port: 3306, user: 'root', password: 'rootpassword' },
    { port: 3307, user: 'root', password: 'rootpassword' },
    { port: 3306, user: 'sw_user', password: 'sw_password' },
    { port: 3307, user: 'sw_user', password: 'sw_password' },
    { port: 3306, user: 'root', password: '123456' },
    { port: 3307, user: 'root', password: '123456' },
    { port: 3306, user: 'root', password: 'root' },
    { port: 3307, user: 'root', password: 'root' },
    { port: 3306, user: 'root', password: 'admin' },
    { port: 3307, user: 'root', password: 'admin' },
    { port: 3306, user: 'root', password: '' },
    { port: 3307, user: 'root', password: '' }
  ]
  for (const config of configs) {
    console.log(`Checking ${config.user} on port ${config.port}...`)
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'smart_workforce'
      })
      console.log(`✅ Connected successfully: ${config.user} on port ${config.port}`)
      await connection.end()
      process.exit(0)
    } catch (err: any) {
      console.log(`❌ Failed: ${err.message}`)
    }
  }
  process.exit(1)
}

check()
