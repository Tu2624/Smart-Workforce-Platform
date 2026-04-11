# Project Phases — Smart Workforce Platform

## Phase 1: Project Setup & Scaffolding ✅ Done
- Monorepo scaffold (backend/ + frontend/)
- DB schema: 12 migrations, all 11 tables
- Docker Compose (MySQL 8 + backend + frontend)
- Base documentation (docs/)

---

## Phase 2: Authentication & User Management 🔄 In Progress
**Goal**: All 3 roles can log in; employer can create and manage their students.

- `POST /api/auth/login` — all roles
- `POST /api/auth/register` — employer self-registration only (students do NOT self-register)
- `POST /api/employers/employees` — employer creates student account, returns temp password
- `GET/PUT /api/auth/me`, `PUT /api/auth/change-password` — profile management
- Frontend: LoginPage, RegisterPage, role-based redirect after login (student/employer/admin dashboards)
- **Completion gate**: All 3 role dashboards reachable, employer can create a student and that student can log in.

---

## Phase 3: Job & Shift Management
**Goal**: Employer can post jobs and define shifts; students can browse them.

- Employer: `POST/GET/PUT/DELETE /api/jobs` — job CRUD
- Employer: `POST/GET/PUT/DELETE /api/shifts` — shift CRUD (linked to job, includes schedule, capacity, hourly_rate)
- Student: `GET /api/jobs`, `GET /api/shifts` — browse available work
- Admin: read-only view of all jobs/shifts
- **Completion gate**: Employer creates a job with 3 shifts; student browses and sees them.

---

## Phase 4: Shift Registration
**Goal**: Students register for shifts; employer approves/rejects; deadline enforced.

- `POST /api/shifts/:id/register` — student registers (no conflict check by design; conflicts resolved at scheduling)
- `DELETE /api/shifts/:id/register` — student cancels own registration
- Registration deadline: Sunday 12:00 noon — backend enforces, rejects after deadline
- `PUT /api/registrations/:id/approve|reject` — employer manually approves/rejects
- Socket.io events: `shift:registered`, `shift:approved`, `shift:rejected`
- **Completion gate**: Student registers → employer approves → Socket.io event fires to student.

---

## Phase 5: Auto-Scheduler & Attendance
**Goal**: Weekly auto-assign resolves pending registrations; check-in/out works with late detection.

**Scheduler** (cron `0 0 * * 1` — Monday 00:00):
- Resolve all `pending` registrations for the week
- Sort by reputation score for priority (≥150 = high, 100–149 = normal, 50–99 = low)
- Reject lower-priority student if shift is over capacity
- Emit `shift:approved` / `shift:rejected` via Socket.io
- `lowRegistrationAlert` → emit `shift:low_registration` to employer

**Attendance**:
- `POST /api/attendance/checkin` — records check-in time, detects late (> 5 min threshold)
- `POST /api/attendance/checkout` — records check-out, triggers payroll calculation (Phase 6)
- `PUT /api/attendance/:id/force-checkout` — employer force-checkout → marks `incomplete`, max 3×/student/month
- Cron `*/30 * * * *`: `autoDetectAbsent` marks no-show students as `absent`
- Socket.io: `attendance:update`
- **Completion gate**: Student checks in late → status = `late`, late_minutes recorded. Force-checkout marks `incomplete`.

---

## Phase 6: Payroll Engine & Reputation System
**Goal**: Payroll updates in real-time after each checkout; reputation score reflects behavior.

**Payroll** (triggered immediately after checkout):
- Create `payroll_item` using deduction model:
  ```
  scheduled_pay   = duration_hours × hourly_rate
  late_deduction  = (late_minutes / 60) × hourly_rate
  early_deduction = (early_minutes / 60) × hourly_rate
  total_pay       = MAX(0, scheduled_pay − late_deduction − early_deduction)
  ```
- `incomplete` attendance → `hours_worked = 0`, `total_pay = 0`
- Accumulate into calendar-month `payroll` record (`draft` until employer confirms)
- `PUT /api/payroll/:id/confirm|paid` — employer confirms/marks paid
- Socket.io: `payroll:updated` → student sees earnings update immediately

**Reputation** (update after each relevant event):
- All delta events from spec: on-time (+2), full shift (+3), late 1–15 min (−2), late >15 min (−5), absent (−10), cancel <24h before start (−7), good/bad employer rating (+5/−8)
- `POST /api/shifts/:id/rate` — employer rates student (1–5 stars)
- Score <50 → blocked from auto-assign eligibility
- **Completion gate**: Student completes a late shift → payroll_item deducted correctly → reputation decremented → student sees updated earnings.

---

## Phase 7: Analytics, Reports & Admin Dashboard
**Goal**: Admin can manage the platform; employers get reports; all notifications wired up.

**Admin**:
- `GET /api/admin/users` — list all users with filters
- `PUT /api/admin/users/:id/suspend|activate` — manage accounts
- `GET /api/admin/stats` — system-wide statistics (headcount, total payroll, shift fill rate)

**Reports** (employer):
- `GET /api/reports/payroll?month=` — payroll summary by month
- `GET /api/reports/attendance?shiftId=` — attendance breakdown per shift

**Notifications** (complete the module):
- `POST /api/notifications` — create & persist notification to DB
- `GET /api/notifications` — student/employer reads their notifications
- `sendReminders` cron (`*/30 * * * *`): shift reminders 1h before start → Socket.io `shift:reminder`
- **Completion gate**: Admin suspends a user; employer views monthly payroll report; student receives shift reminder notification.
