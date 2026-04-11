const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME});
  const [jobs] = await c.query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 5');
  console.log('Jobs:', jobs);
  await c.end();
}
run().catch(console.error);
