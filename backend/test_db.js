const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME});
  const [users] = await c.query('SELECT id, email, full_name, role FROM users');
  console.log('Users:', users);
  await c.end();
}
run().catch(console.error);
