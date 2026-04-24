import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import pool from '../src/config/database'

async function seed() {
  console.log('🌱 Starting seed...')

  // Clear existing data (FK order: leaf → parent)
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const tbl of [
    'ratings', 'reputation_events', 'payroll_items', 'payroll',
    'attendance', 'shift_registrations', 'shifts', 'jobs',
    'student_profiles', 'employer_profiles', 'notifications', 'users',
  ]) {
    await pool.query(`TRUNCATE TABLE ${tbl}`)
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')
  console.log('✓ Tables cleared')

  const hash = async (p: string) => bcrypt.hash(p, 10)

  // ── Users ────────────────────────────────────────────────
  const adminId     = uuidv4()
  const emp1Id      = uuidv4()
  const emp2Id      = uuidv4()
  const std1Id      = uuidv4()
  const std2Id      = uuidv4()
  const std3Id      = uuidv4()
  const std4Id      = uuidv4()

  await pool.query(
    'INSERT INTO users (id, email, password_hash, full_name, role, phone) VALUES ?',
    [[
      [adminId,  'admin@test.com',      await hash('Admin123!'),    'Admin System',     'admin',    '0900000000'],
      [emp1Id,   'employer1@test.com',  await hash('Employer123!'), 'Công ty ABC',      'employer', '0901111111'],
      [emp2Id,   'employer2@test.com',  await hash('Employer123!'), 'Công ty XYZ',      'employer', '0902222222'],
      [std1Id,   'student1@test.com',   await hash('Student123!'),  'Nguyễn Văn An',    'student',  '0911111111'],
      [std2Id,   'student2@test.com',   await hash('Student123!'),  'Trần Thị Bình',    'student',  '0912222222'],
      [std3Id,   'student3@test.com',   await hash('Student123!'),  'Lê Minh Châu',     'student',  '0913333333'],
      [std4Id,   'student4@test.com',   await hash('Student123!'),  'Phạm Quốc Đạt',   'student',  '0914444444'],
    ]]
  )
  console.log('✓ Users created')

  // ── Employer profiles ────────────────────────────────────
  await pool.query(
    'INSERT INTO employer_profiles (id, user_id, company_name, address, description) VALUES ?',
    [[
      [uuidv4(), emp1Id, 'Công ty TNHH ABC', '123 Nguyễn Văn Linh, Q.7, TP.HCM', 'Chuyên về logistics và phân phối'],
      [uuidv4(), emp2Id, 'Công ty CP XYZ',   '456 Lê Văn Việt, Q.9, TP.HCM',      'Chuỗi cửa hàng bán lẻ'],
    ]]
  )
  console.log('✓ Employer profiles created')

  // ── Student profiles ────────────────────────────────────
  await pool.query(
    'INSERT INTO student_profiles (id, user_id, employer_id, university, student_id, reputation_score) VALUES ?',
    [[
      [uuidv4(), std1Id, emp1Id, 'Đại học Bách Khoa TP.HCM',  'BK2021001', 120],
      [uuidv4(), std2Id, emp1Id, 'Đại học Kinh Tế TP.HCM',    'UEH2021002', 95],
      [uuidv4(), std3Id, emp2Id, 'Đại học Sư Phạm TP.HCM',    'HCMUE2021003', 145],
      [uuidv4(), std4Id, emp2Id, 'Đại học Tôn Đức Thắng',     'TDT2021004',  75],
    ]]
  )
  console.log('✓ Student profiles created')

  // ── Jobs ────────────────────────────────────────────────
  const job1Id = uuidv4()
  const job2Id = uuidv4()
  const job3Id = uuidv4()

  await pool.query(
    'INSERT INTO jobs (id, employer_id, title, description, hourly_rate, required_skills, max_workers, status) VALUES ?',
    [[
      [job1Id, emp1Id, 'Nhân viên kho hàng',  'Phân loại và đóng gói hàng hóa tại kho', 45000, JSON.stringify(['sức khoẻ', 'làm việc nhóm']),  5, 'active'],
      [job2Id, emp1Id, 'Nhân viên giao hàng', 'Giao hàng nội thành TP.HCM',              55000, JSON.stringify(['bằng lái xe', 'điện thoại']),   3, 'active'],
      [job3Id, emp2Id, 'Nhân viên bán hàng',  'Bán hàng tại cửa hàng tiện lợi',          40000, JSON.stringify(['giao tiếp', 'linh hoạt']),      4, 'active'],
    ]]
  )
  console.log('✓ Jobs created')

  // ── Shifts (past completed + upcoming open) ─────────────
  const now      = new Date()
  const past     = (daysAgo: number, h: number, m = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h, m)
  const future   = (daysAhead: number, h: number, m = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, h, m)

  const s1Id = uuidv4() // completed
  const s2Id = uuidv4() // completed
  const s3Id = uuidv4() // completed
  const s4Id = uuidv4() // open (upcoming)
  const s5Id = uuidv4() // open (upcoming)

  await pool.query(
    'INSERT INTO shifts (id, job_id, employer_id, title, start_time, end_time, max_workers, current_workers, status, auto_assign) VALUES ?',
    [[
      [s1Id, job1Id, emp1Id, 'Ca kho sáng thứ 2',   past(7, 8),  past(7, 12),  3, 2, 'completed', 0],
      [s2Id, job1Id, emp1Id, 'Ca kho chiều thứ 3',  past(6, 13), past(6, 17),  2, 1, 'completed', 0],
      [s3Id, job3Id, emp2Id, 'Ca bán hàng cuối tuần',past(3, 9), past(3, 21),  4, 3, 'completed', 1],
      [s4Id, job1Id, emp1Id, 'Ca kho tuần tới',      future(5, 8), future(5, 12), 4, 0, 'open', 0],
      [s5Id, job3Id, emp2Id, 'Ca bán hàng cuối tuần',future(3, 9), future(3, 21), 3, 0, 'open', 1],
    ]]
  )
  console.log('✓ Shifts created')

  // ── Registrations ────────────────────────────────────────
  const r1Id = uuidv4(); const r2Id = uuidv4(); const r3Id = uuidv4()

  await pool.query(
    'INSERT INTO shift_registrations (id, shift_id, student_id, status) VALUES ?',
    [[
      [r1Id, s1Id, std1Id, 'approved'],
      [r2Id, s1Id, std2Id, 'approved'],
      [r3Id, s2Id, std1Id, 'approved'],
      [uuidv4(), s3Id, std3Id, 'approved'],
      [uuidv4(), s3Id, std4Id, 'approved'],
      [uuidv4(), s3Id, std1Id, 'approved'],
      // Open shifts
      [uuidv4(), s4Id, std1Id, 'pending'],
      [uuidv4(), s5Id, std3Id, 'pending'],
    ]]
  )
  console.log('✓ Registrations created')

  // ── Attendance ───────────────────────────────────────────
  const att1Id = uuidv4(); const att2Id = uuidv4(); const att3Id = uuidv4()
  const att4Id = uuidv4(); const att5Id = uuidv4()

  await pool.query(
    'INSERT INTO attendance (id, shift_id, student_id, check_in_time, check_out_time, status, hours_worked) VALUES ?',
    [[
      [att1Id, s1Id, std1Id, past(7, 8, 3),  past(7, 12, 0), 'on_time',  3.95],
      [att2Id, s1Id, std2Id, past(7, 8, 12), past(7, 12, 0), 'late',     3.80],
      [att3Id, s2Id, std1Id, past(6, 13, 0), past(6, 17, 0), 'on_time',  4.00],
      [att4Id, s3Id, std3Id, past(3, 9, 0),  past(3, 21, 0), 'on_time',  12.00],
      [att5Id, s3Id, std4Id, past(3, 9, 20), past(3, 21, 0), 'late',     11.67],
    ]]
  )
  console.log('✓ Attendance created')

  // ── Payroll ──────────────────────────────────────────────
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`

  const pay1Id = uuidv4()  // std1 at emp1
  const pay2Id = uuidv4()  // std2 at emp1
  const pay3Id = uuidv4()  // std3 at emp2

  await pool.query(
    'INSERT INTO payroll (id, student_id, employer_id, period_start, period_end, total_hours, total_amount, status) VALUES ?',
    [[
      [pay1Id, std1Id, emp1Id, month, monthEnd, 7.95,  357750, 'confirmed'],
      [pay2Id, std2Id, emp1Id, month, monthEnd, 3.80,  171000, 'draft'],
      [pay3Id, std3Id, emp2Id, month, monthEnd, 12.00, 480000, 'paid'],
    ]]
  )

  await pool.query(
    'INSERT INTO payroll_items (id, payroll_id, attendance_id, shift_id, scheduled_hours, hours_worked, hourly_rate, deduction_minutes, deduction_amount, subtotal) VALUES ?',
    [[
      [uuidv4(), pay1Id, att1Id, s1Id, 4, 3.95, 45000, 0,  0,      177750],
      [uuidv4(), pay1Id, att3Id, s2Id, 4, 4.00, 45000, 0,  0,      180000],
      [uuidv4(), pay2Id, att2Id, s1Id, 4, 3.80, 45000, 12, 9000,   171000],
      [uuidv4(), pay3Id, att4Id, s3Id, 12, 12.0, 40000, 0,  0,      480000],
    ]]
  )
  console.log('✓ Payroll created')

  // ── Ratings ─────────────────────────────────────────────
  await pool.query(
    'INSERT INTO ratings (id, shift_id, student_id, employer_id, score, comment) VALUES ?',
    [[
      [uuidv4(), s1Id, std1Id, emp1Id, 5, 'Làm việc rất chăm chỉ, đúng giờ và có tinh thần trách nhiệm'],
      [uuidv4(), s1Id, std2Id, emp1Id, 3, 'Trễ một chút nhưng hoàn thành công việc'],
      [uuidv4(), s3Id, std3Id, emp2Id, 5, 'Xuất sắc, nhiệt tình và hỗ trợ khách hàng rất tốt'],
    ]]
  )
  console.log('✓ Ratings created')

  // ── Reputation events ────────────────────────────────────
  await pool.query(
    'INSERT INTO reputation_events (id, student_id, event_type, delta, reason) VALUES ?',
    [[
      [uuidv4(), std1Id, 'on_time_checkin', 2.0,  'Ca s1Id check-in đúng giờ'],
      [uuidv4(), std1Id, 'complete_shift',  3.0,  'Hoàn thành ca s1Id'],
      [uuidv4(), std1Id, 'good_rating',     5.0,  'Đánh giá 5 sao ca s1Id'],
      [uuidv4(), std1Id, 'on_time_checkin', 2.0,  'Ca s2Id check-in đúng giờ'],
      [uuidv4(), std1Id, 'complete_shift',  3.0,  'Hoàn thành ca s2Id'],
      [uuidv4(), std2Id, 'late_minor',     -2.0,  'Trễ 12 phút ca s1Id'],
      [uuidv4(), std2Id, 'complete_shift',  3.0,  'Hoàn thành ca s1Id'],
      [uuidv4(), std3Id, 'on_time_checkin', 2.0,  'Ca s3Id check-in đúng giờ'],
      [uuidv4(), std3Id, 'complete_shift',  3.0,  'Hoàn thành ca s3Id'],
      [uuidv4(), std3Id, 'good_rating',     5.0,  'Đánh giá 5 sao ca s3Id'],
      [uuidv4(), std4Id, 'late_minor',     -2.0,  'Trễ 20 phút ca s3Id'],
      [uuidv4(), std4Id, 'complete_shift',  3.0,  'Hoàn thành ca s3Id'],
    ]]
  )

  // Sync reputation_score with events
  await pool.query(`UPDATE student_profiles SET reputation_score = 120 + 5 + 2 + 2 + 3 + 3 - 100 WHERE user_id = ?`, [std1Id])
  // std1: default 100 + 2+3+5+2+3 = 115 → set to 115? Let me just set manually
  await pool.query('UPDATE student_profiles SET reputation_score = 115 WHERE user_id = ?', [std1Id])
  await pool.query('UPDATE student_profiles SET reputation_score = 101 WHERE user_id = ?', [std2Id])
  await pool.query('UPDATE student_profiles SET reputation_score = 110 WHERE user_id = ?', [std3Id])
  await pool.query('UPDATE student_profiles SET reputation_score = 101 WHERE user_id = ?', [std4Id])
  console.log('✓ Reputation events created')

  await pool.end()
  console.log('\n✅ Seed hoàn tất!')
  console.log('Tài khoản test:')
  console.log('  admin@test.com      / Admin123!')
  console.log('  employer1@test.com  / Employer123!')
  console.log('  employer2@test.com  / Employer123!')
  console.log('  student1@test.com   / Student123!')
  console.log('  student2@test.com   / Student123!')
  console.log('  student3@test.com   / Student123!')
  console.log('  student4@test.com   / Student123!')
}

seed().catch(err => { console.error('❌ Seed thất bại:', err); process.exit(1) })
