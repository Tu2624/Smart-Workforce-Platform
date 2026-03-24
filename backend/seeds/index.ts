import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool } from '../src/config/database'

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clear existing data
    await client.query(`TRUNCATE reputation_events, notifications, payroll_items, payroll, attendance, shift_registrations, shifts, jobs, employer_profiles, student_profiles, users RESTART IDENTITY CASCADE`)

    const hash = await bcrypt.hash('Admin123!', 10)
    const studentHash = await bcrypt.hash('Student123!', 10)
    const employerHash = await bcrypt.hash('Employer123!', 10)

    // Users
    const adminResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin') RETURNING id`,
      ['admin@test.com', hash, 'Admin System'],
    )
    const employer1Result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'employer') RETURNING id`,
      ['employer1@test.com', employerHash, 'Nguyen Thi B'],
    )
    const student1Result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'student') RETURNING id`,
      ['student1@test.com', studentHash, 'Tran Van C'],
    )
    const student2Result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'student') RETURNING id`,
      ['student2@test.com', studentHash, 'Le Thi D'],
    )

    const adminId = adminResult.rows[0].id
    const emp1Id = employer1Result.rows[0].id
    const stu1Id = student1Result.rows[0].id
    const stu2Id = student2Result.rows[0].id

    // Profiles
    await client.query(`INSERT INTO employer_profiles (user_id, company_name) VALUES ($1, 'Quán Cà Phê ABC')`, [emp1Id])
    await client.query(`INSERT INTO student_profiles (user_id, student_id, university, reputation_score) VALUES ($1, 'B22DCPT001', 'PTIT', 120)`, [stu1Id])
    await client.query(`INSERT INTO student_profiles (user_id, student_id, university, reputation_score) VALUES ($1, 'B22DCPT002', 'PTIT', 80)`, [stu2Id])

    // Jobs
    const job1Result = await client.query(
      `INSERT INTO jobs (employer_id, title, description, hourly_rate, max_workers) VALUES ($1, 'Nhân viên phục vụ', 'Phục vụ bàn, lấy order', 30000, 5) RETURNING id`,
      [emp1Id],
    )
    const job2Result = await client.query(
      `INSERT INTO jobs (employer_id, title, description, hourly_rate, max_workers) VALUES ($1, 'Nhân viên pha chế', 'Pha đồ uống', 35000, 3) RETURNING id`,
      [emp1Id],
    )
    const job1Id = job1Result.rows[0].id
    const job2Id = job2Result.rows[0].id

    // Shifts
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const nextWeek = new Date(now.getTime() + 7 * 86400000)
    const yesterday = new Date(now.getTime() - 86400000)

    const shift1Result = await client.query(
      `INSERT INTO shifts (job_id, employer_id, title, start_time, end_time, max_workers) VALUES ($1, $2, 'Ca sáng mai', $3, $4, 3) RETURNING id`,
      [job1Id, emp1Id, new Date(tomorrow.setHours(8, 0, 0, 0)).toISOString(), new Date(tomorrow.setHours(12, 0, 0, 0)).toISOString()],
    )
    const shift2Result = await client.query(
      `INSERT INTO shifts (job_id, employer_id, title, start_time, end_time, max_workers) VALUES ($1, $2, 'Ca chiều tuần tới', $3, $4, 2) RETURNING id`,
      [job2Id, emp1Id, new Date(nextWeek.setHours(13, 0, 0, 0)).toISOString(), new Date(nextWeek.setHours(17, 0, 0, 0)).toISOString()],
    )
    const shift3Result = await client.query(
      `INSERT INTO shifts (job_id, employer_id, title, start_time, end_time, max_workers, status) VALUES ($1, $2, 'Ca hôm qua (completed)', $3, $4, 2, 'completed') RETURNING id`,
      [job1Id, emp1Id, new Date(yesterday.setHours(8, 0, 0, 0)).toISOString(), new Date(yesterday.setHours(12, 0, 0, 0)).toISOString()],
    )

    const shift1Id = shift1Result.rows[0].id
    const shift3Id = shift3Result.rows[0].id

    // Registrations
    await client.query(
      `INSERT INTO shift_registrations (shift_id, student_id, status) VALUES ($1, $2, 'approved')`,
      [shift1Id, stu1Id],
    )
    await client.query(
      `INSERT INTO shift_registrations (shift_id, student_id, status) VALUES ($1, $2, 'pending')`,
      [shift1Id, stu2Id],
    )

    // Attendance for completed shift
    const checkIn = new Date(yesterday)
    checkIn.setHours(8, 5, 0, 0)
    const checkOut = new Date(yesterday)
    checkOut.setHours(12, 0, 0, 0)
    await client.query(
      `INSERT INTO attendance (shift_id, student_id, check_in_time, check_out_time, status, late_minutes, hours_worked) VALUES ($1, $2, $3, $4, 'on_time', 0, 3.92)`,
      [shift3Id, stu1Id, checkIn.toISOString(), checkOut.toISOString()],
    )

    await client.query('COMMIT')
    console.log('Seed completed successfully!')
    console.log(`Admin: admin@test.com / Admin123!`)
    console.log(`Employer: employer1@test.com / Employer123!`)
    console.log(`Student 1: student1@test.com / Student123! (reputation: 120)`)
    console.log(`Student 2: student2@test.com / Student123! (reputation: 80)`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
