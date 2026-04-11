const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME});
  const [shifts] = await c.query('SELECT * FROM shifts ORDER BY created_at DESC LIMIT 5');
  console.log('Shifts:', shifts);
  await c.end();
}
run().catch(console.error);
