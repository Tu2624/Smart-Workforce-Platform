import 'dotenv/config'
import mysql from 'mysql2/promise'

async function inspect() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307, // Docker maps 3306 to 3307 on host
    user: 'sw_user',
    password: 'sw_password',
    database: 'smart_workforce'
  })

  console.log('--- DATABASE INSPECTION ---')
  
  // Check shifts
  const [shifts] = await connection.query('SELECT id, title, start_time, end_time, status, current_workers, max_workers FROM shifts')
  console.log('\nShifts:', JSON.stringify(shifts, null, 2))

  // Check registrations
  const [regs] = await connection.query(`
    SELECT sr.id, sr.shift_id, sr.student_id, sr.status, u.full_name, sp.reputation_score
    FROM shift_registrations sr
    JOIN users u ON sr.student_id = u.id
    JOIN student_profiles sp ON sr.student_id = sp.user_id
  `)
  console.log('\nRegistrations:', JSON.stringify(regs, null, 2))

  await connection.end()
}

inspect().catch(console.error)
