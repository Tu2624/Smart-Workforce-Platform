# 03 — Backend Specification
## Smart Workforce Platform

## Role

**Persona**: Backend Engineer & API Contract Owner
**Primary Focus**: REST endpoint specification, middleware chain, Socket.io event emission, background job logic, and server-side business rule implementation.
**Perspective**: You are defining the contract that the frontend must consume and tests must verify. Every endpoint you define creates obligations on 3 other files simultaneously. Think: "Does this response shape match the frontend's TypeScript types? Does this business rule match the formula in system design? Does this error code have a corresponding test case?"

### Responsibilities
- Define each REST endpoint: method, path, auth requirements, request body, response shape, error codes
- Specify middleware behavior: authMiddleware (JWT verify, req.user), roleGuard (role enforcement), validate (Zod), errorHandler
- Define Socket.io event emission: which service emits which event, to which room, with what payload
- Specify background job logic: trigger conditions, SQL queries, side effects, cron schedule
- Document server-side business rules: conflict detection SQL, late detection logic, absent detection, hours_worked cap

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Add or change an endpoint | `docs/04-frontend.md` §8 | Corresponding function in `src/api/*.ts` must be added/updated |
| Change field name or type in response | `docs/04-frontend.md` §4 | Zustand store interfaces and TypeScript types depend on exact field names |
| Add new Socket.io event (server → client) | `docs/04-frontend.md` §6 | `socket.on()` handler must be added to the corresponding frontend hook |
| Add new role guard to a route | `docs/04-frontend.md` §9 | `RoleRoute` and `ProtectedRoute` enforce the same role at the UI level |
| Change business rule (conflict, late, absent) | `docs/01-system-design.md` | Canonical rule definition lives there; must stay consistent |
| Change business rule (conflict, late, absent) | `docs/05-testing.md` §3 | Integration test cases encode the boundary conditions of the specific rule |
| Add/change background job schedule | `docs/02-project-init.md` | Cron env var must be added/updated in `.env.example` |
| Add new module folder | `docs/02-project-init.md` | Directory tree must be updated to reflect the new module |

### Files to Consult First
- `docs/01-system-design.md` — verify DB schema supports the query being written
- `docs/04-frontend.md` — confirm response shape matches TypeScript types before finalizing contract
- `docs/05-testing.md` — ensure a corresponding test exists or needs to be added for new endpoints

---

## 1. Module Breakdown

| Module | Functionality |
|--------|--------------|
| **Auth** | Login, profile (employer self-registers; student created by employer) |
| **Job** | CRUD jobs (employer), list jobs (student) |
| **Shift** | CRUD shifts, shift registration, approve/reject, weekly scheduling |
| **Attendance** | Check-in, check-out, view history |
| **Payroll** | Calculate payroll, view payslips, export file |
| **Notification** | Send, view, mark as read |
| **Rating** | Employer rates student after shift, feeds into reputation |
| **Report** | Shift statistics, performance, labor costs |
| **Admin** | Manage users, lock accounts, view system-wide stats |

---

## 2. REST API Endpoints

### Base URL: `/api`

> **Auth headers**: `Authorization: Bearer <token>`
> **Role guards**: `[S]` = Student, `[E]` = Employer, `[A]` = Admin

---

### 2.1 Auth Module — `/api/auth`

> **User creation policy**: Only employers can self-register. Students do NOT have a self-registration flow — student accounts are created by the employer via a dedicated endpoint.

#### `POST /api/auth/register`
Register a new employer account (employer only).
```json
// Request
{
  "email": "employer@company.com",
  "password": "Password123!",
  "full_name": "Nguyen Van B",
  "phone": "0901234567",
  "company_name": "ABC Corp"
}

// Response 201
{
  "message": "Registration successful",
  "user": { "id": "uuid", "email": "...", "role": "employer" },
  "token": "eyJ..."
}
```

#### `POST /api/employers/employees` `[E]`
Employer creates a student account (new employee).
```json
// Request
{
  "email": "student@example.com",
  "full_name": "Nguyen Van A",
  "phone": "0901234567",
  "student_id": "B22DCPT244",
  "university": "PTIT"
}

// Response 201
{
  "message": "Employee account created successfully",
  "user": { "id": "uuid", "email": "...", "role": "student" },
  "temp_password": "Auto-generated, sent to employee's email"
}
```

#### `GET /api/employers/employees` `[E]`
List employees (students) belonging to the employer. Query: `?is_active=true&page=1&limit=20`

#### `POST /api/auth/login`
```json
// Request
{ "email": "...", "password": "..." }

// Response 200
{
  "token": "eyJ...",
  "user": { "id": "uuid", "email": "...", "role": "student", "full_name": "..." }
}
```

#### `GET /api/auth/me` `[S|E|A]`
Returns the current user's information + corresponding profile.

#### `PUT /api/auth/profile` `[S|E]`
Update profile (full_name, phone, avatar_url, skills, university...).

#### `PUT /api/auth/change-password` `[S|E|A]`
```json
{ "current_password": "...", "new_password": "..." }
```

---

### 2.2 Job Module — `/api/jobs`

#### `POST /api/jobs` `[E]`
Create a new job.
```json
// Request
{
  "title": "Service Staff",
  "description": "...",
  "hourly_rate": 30000,
  "required_skills": ["communication", "agility"],
  "max_workers": 5
}

// Response 201
{ "job": { "id": "uuid", "title": "...", "status": "active", ... } }
```

#### `GET /api/jobs` `[S|E]`
List jobs. Query params: `?status=active&page=1&limit=10`

#### `GET /api/jobs/:id` `[S|E]`
Get single job details.

#### `PUT /api/jobs/:id` `[E]`
Edit job (only the employer who owns the job).

#### `DELETE /api/jobs/:id` `[E]`
Delete job (only when no active shifts exist).

#### `PATCH /api/jobs/:id/status` `[E]`
```json
{ "status": "paused" }  // "active" | "paused" | "closed"
```

---

### 2.3 Shift Module — `/api/shifts`

#### `POST /api/shifts` `[E]`
Create a shift for a job.
```json
// Request
{
  "job_id": "uuid",
  "title": "Monday Morning Shift",
  "start_time": "2024-03-25T08:00:00+07:00",
  "end_time": "2024-03-25T12:00:00+07:00",
  "max_workers": 3,
  "auto_assign": false
}

// Response 201
{ "shift": { "id": "uuid", "status": "open", ... } }
```

#### `GET /api/shifts` `[S|E]`
- Employer: all their shifts, filter: `?job_id=&status=&date=`
- Student: all shifts with `status=open` from active jobs, filter: `?date=&job_id=`

#### `GET /api/shifts/:id` `[S|E]`
Shift details, including list of registered workers.

#### `PUT /api/shifts/:id` `[E]`
Edit shift (only when status=open).

#### `DELETE /api/shifts/:id` `[E]`
Cancel shift, automatically notifies registered students.

#### `POST /api/shifts/:id/register` `[S]`
Register for a shift.
```json
// Response 201
{ "registration": { "id": "uuid", "status": "pending", "registered_at": "..." } }

// Error 409: already registered for this shift
{ "error": "ALREADY_REGISTERED", "message": "You have already registered for this shift" }

// Error 400: past registration deadline (Sunday 12:00 noon)
{ "error": "REGISTRATION_CLOSED", "message": "Registration for this week's shifts is closed" }
```
> **No conflict check**: Students may register for overlapping shifts. The scheduler will resolve conflicts when it runs.

#### `POST /api/shifts/:id/assign` `[E]`
Employer manually assigns a student to a shift (used when shift is understaffed before deadline).
```json
// Request
{ "student_id": "uuid" }

// Response 201
{ "registration": { "id": "uuid", "status": "approved", ... } }

// Error 400: shift is full
{ "error": "SHIFT_FULL", "message": "This shift is already at maximum capacity" }
```

#### `GET /api/shifts/:id/registrations` `[E]`
List of applicants registered for the shift.

#### `PATCH /api/shifts/:id/registrations/:reg_id` `[E]`
Approve or reject a registration.
```json
{ "status": "approved" }  // "approved" | "rejected"
```

#### `DELETE /api/shifts/:id/register` `[S]`
Cancel shift registration.
```
Business rules:
- If registration.status=approved before cancel → shift.current_workers -= 1, slot reopens
- Cancel before shift starts AND ≥ 24h before start_time → status=cancelled, NO reputation penalty
- Cancel before shift starts AND < 24h before start_time → status=cancelled, deduct -7.0 reputation
- Cannot cancel if shift is ongoing or completed
```

---

### 2.4 Attendance Module — `/api/attendance`

#### `POST /api/attendance/checkin` `[S]`
```json
// Request
{ "shift_id": "uuid" }

// Response 201
{
  "attendance": {
    "id": "uuid",
    "status": "on_time",   // "on_time" | "late"
    "late_minutes": 0,
    "check_in_time": "2024-03-25T08:02:00+07:00"
  }
}
```

#### `POST /api/attendance/checkout` `[S]`
```json
{ "shift_id": "uuid" }
// Response: updates check_out_time, calculates hours_worked
```

#### `GET /api/attendance` `[S]`
Student's attendance history. Query: `?page=1&limit=20&status=`

#### `GET /api/attendance/shift/:shift_id` `[E]`
Attendance list for a shift (employer view).

#### `PATCH /api/attendance/:id` `[E]`
Manual edit (note, override status).

#### `PATCH /api/attendance/:id/force-complete` `[E]`
Employer force-checks out a student remotely when the shift has ended but the student has not checked out.
```
Preconditions:
  - shift.end_time has passed (shift has ended)
  - attendance.status = 'incomplete' (student checked in but did not check out)
  - Employer must be the owner of that shift

Limit: max 3 times / student / calendar month

Response 200: updated attendance record (hours_worked, status, force_checkout=true)

Errors:
  403 FORCE_CHECKOUT_LIMIT_EXCEEDED — 3 force-checkouts already used for this student this month
  400 SHIFT_NOT_ENDED           — shift has not ended yet
  409 ALREADY_COMPLETED         — student already checked out
  403 FORBIDDEN                 — employer is not the owner of the shift
```

---

### 2.5 Payroll Module — `/api/payroll`

#### `GET /api/payroll` `[S]`
Student's payroll history. Query: `?period=week|month&year=2024&month=3`

#### `GET /api/payroll/:id` `[S]`
Details of a single payroll period, including `payroll_items[]`.

#### `GET /api/payroll/employer` `[E]`
Payroll table for all employees by period. Query: `?period_start=&period_end=`

#### `POST /api/payroll/calculate` `[E]`
Manually trigger payroll calculation for a period.
```json
{ "period_start": "2024-03-01", "period_end": "2024-03-31" }
```

#### `PATCH /api/payroll/:id/confirm` `[E]`
Confirm payroll (status: draft → confirmed).

#### `PATCH /api/payroll/:id/paid` `[E]`
Mark as paid (status: confirmed → paid).

#### `GET /api/payroll/:id/export` `[E]`
Export PDF or Excel file. Query: `?format=pdf|excel`

---

### 2.6 Notification Module — `/api/notifications`

#### `GET /api/notifications` `[S|E]`
User's notification list. Query: `?is_read=false&limit=20`

#### `PATCH /api/notifications/:id/read` `[S|E]`
Mark a single notification as read.

#### `PATCH /api/notifications/read-all` `[S|E]`
Mark all notifications as read.

---

### 2.7 Report Module — `/api/reports` `[E]`

#### `GET /api/reports/overview`
Overview statistics: total shifts, total hours, cost this month.

#### `GET /api/reports/shifts`
Shift statistics over time. Query: `?from=&to=`

#### `GET /api/reports/performance`
Employee performance: number of shifts, on-time rate, reputation score.

#### `GET /api/reports/payroll-summary`
Total labor cost by month.

---

### 2.8 Rating Module — `/api/ratings`

#### `POST /api/ratings` `[E]`
Employer rates a student after the shift ends.
```json
// Request
{
  "shift_id": "uuid",
  "student_id": "uuid",
  "score": 4,          // 1–5
  "comment": "Employee performed well and was on time"
}

// Response 201
{ "rating": { "id": "uuid", "score": 4, "created_at": "..." } }

// Error 400: shift not yet completed
{ "error": "SHIFT_NOT_COMPLETED", "message": "You can only rate after the shift ends" }
// Error 409: already rated
{ "error": "ALREADY_RATED", "message": "You have already rated this employee for this shift" }
```
> **Side effect**: Automatically updates the student's reputation_score:
> - score 4–5: +5.0 (good_review event)
> - score 3: no change
> - score 1–2: -8.0 (bad_review event)

#### `GET /api/ratings/student/:student_id` `[E|S]`
View rating history for a student. Query: `?page=1&limit=10`

---

### 2.9 Admin Module — `/api/admin` `[A]`

#### `GET /api/admin/users`
List all users. Filter: `?role=&is_active=&page=`

#### `PATCH /api/admin/users/:id/toggle-status`
Lock / unlock an account.

#### `GET /api/admin/jobs`
All jobs in the system.

#### `GET /api/admin/stats`
System statistics: total users, total jobs, total shifts, total revenue.

#### `POST /api/admin/employers`
Admin creates a new employer account. Body: `{ email, password, company_name, address?, description? }`
Response `201`: `{ user, employer_profile, temp_password }`

#### `GET /api/admin/employers/:id/shifts`
View all shifts for a specific employer. Filter: `?status=&page=`

#### `GET /api/admin/employers/:id/payroll`
View all payroll records for a specific employer. Filter: `?month=&year=`

#### `PATCH /api/admin/payroll/:id`
Admin overrides a payroll record (manual adjustment). Body: `{ total_amount?, note? }`
Response `200`: updated payroll record.

---

## 3. Middleware

### `authMiddleware.ts`
```typescript
// Verify JWT from Authorization header
// Attach req.user = { id, email, role }
// Return 401 if token is invalid or expired
```

### `roleGuard.ts`
```typescript
// roleGuard('employer') → 403 if req.user.role !== 'employer'
// roleGuard('student', 'employer') → allows multiple roles
```

### `errorHandler.ts`
```typescript
// Global error handler — normalizes error response:
{
  "error": "ERROR_CODE",
  "message": "Error description",
  "details": {}   // optional, Zod validation errors
}
```

### `validate.ts`
```typescript
// Zod schema validation middleware
// validate(schema) → 400 if body/query/params are invalid
```

---

## 4. Socket.io Events (Server)

```typescript
// When user connects: join room 'user_<user_id>'
io.on('connection', (socket) => {
  socket.on('join:room', ({ room }) => socket.join(room))
  socket.on('join:shift', ({ shift_id }) => socket.join(`shift_${shift_id}`))
})

// Emit helper
function notify(userId: string, event: string, data: object) {
  io.to(`user_${userId}`).emit(event, data)
}

// Events emitted:
// notification:new    → when a new notification is created
// attendance:update   → when student checks in/out
// shift:registered    → when student registers for a shift
// shift:approved      → when employer approves a shift
// payroll:updated     → when payroll calculation completes
// shift:reminder      → from background job
```

---

## 5. Background Jobs

### `weeklyScheduler.ts` (replaces autoAssignShift.ts)
- **Schedule**: `0 0 * * 1` — Monday 00:00 every week
- **Registration deadline**: Sunday 12:00 noon (system does not block registrations after deadline, but the scheduler only processes registrations created before the deadline)
- **Logic**:
  1. Query all `shift_registrations` with status=`pending` where `shift.start_time` is in the coming week
  2. Group by `shift_id`
  3. For each shift: sort students by `reputation_score DESC, registered_at ASC`
  4. Take up to `shift.max_workers` top students, check for cross-shift conflicts
  5. Approved students: `status=approved`, increment `shift.current_workers`
  6. Rejected students (exceeds max or conflict): `status=rejected`
  7. Send notification to ALL students (approved and rejected)
  8. Log scheduling results

### `lowRegistrationAlert.ts` (integrated into `sendReminders.ts`)
- **Schedule**: `0 11 * * 0` — Sunday 11:00 AM (1 hour before deadline)
- **Logic**:
  1. Query all shifts for the coming week with `current_workers = 0` (no one approved yet)
  2. For each such shift, count pending registrations
  3. If `pending_count < max_workers` → emit `shift:low_registration` to employer
  4. Employer has 1 hour to manually assign before the 12:00 noon deadline

### `autoDetectAbsent.ts`
- **Schedule**: Every 30 minutes (integrated into `sendReminders.ts`)
- **Logic**:
  1. Query shifts with `start_time <= NOW() - 30 minutes` and `status=ongoing`
  2. Find shift_registrations with `status=approved` but no attendance record
  3. Create attendance record with `status=absent`
  4. Deduct -10.0 reputation, send notification to employer

### `autoCalcPayroll.ts`
- **Trigger**: Called immediately after shift completes (checkout or `autoDetectAbsent` marks absent) — **real-time per shift**, not a daily batch
- **Fallback schedule**: `CRON_PAYROLL_SCHEDULE` (default 00:00 daily) — catch-up for any attendance missed
- **Logic**:
  1. Find all attendance records with `status != pending` that have no payroll_item yet
  2. Calculate `base_pay`, `bonus`, `penalty` using the formula (see system-design)
  3. Create `payroll_item` for each attendance record immediately (accumulated)
  4. Create/update `payroll` record (monthly summary) — `total_amount` = sum of all payroll_items in the period
  5. Emit `payroll:updated` to student

### `sendReminders.ts`
- **Schedule**: `CRON_REMINDER_SCHEDULE` (default every 30 minutes)
- **Logic**:
  1. Query shifts starting within the next hour
  2. Get list of approved students
  3. Create notification + emit `shift:reminder`

---

## 6. Business Logic Rules

### Conflict Detection (only in Scheduler, NOT at registration time)
```
Scheduler resolves conflicts when running at Monday 00:00:
  For each student, after approving a shift:
    Reject all other pending registrations for that student if:
      (approved_shift.start_time < other_shift.end_time)
      AND
      (approved_shift.end_time > other_shift.start_time)
    → Prioritize the shift with better reputation fit, then earlier registration

> At the time student calls POST /shifts/:id/register: NO conflict check.
> Students are allowed to register for multiple overlapping shifts.
```

### Timezone
```
All DATETIME values in DB are stored directly in UTC+7 (Asia/Ho_Chi_Minh).
Server and frontend both use UTC+7. No timezone conversion needed — stored as-is.
mysql2 driver is configured with timezone: '+07:00' to ensure correct
JavaScript Date ↔ MySQL DATETIME conversion. See src/config/database.ts.
```

### Late Detection
```
check_in_time > shift.start_time + 5 minutes → status = 'late'
late_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, shift.start_time, check_in_time))
```

### Absent Detection
```
Background job (30 minutes after shift.start_time):
  attendance.check_in_time IS NULL → status = 'absent'
  → Deduct reputation, send notification to employer
```

### hours_worked Calculation
```sql
-- Calculate hours_worked, capped at shift duration:
hours_worked = LEAST(
  TIMESTAMPDIFF(SECOND, check_in_time, check_out_time) / 3600,
  TIMESTAMPDIFF(SECOND, shift.start_time, shift.end_time) / 3600
)
-- If student checks out later than shift.end_time → only count up to shift.end_time
-- If student checks out on time or early → use actual time
```

### MySQL Query Patterns

> These patterns are required for all service files. Driver: `mysql2/promise`.

**Pattern A — Connection pool** (`src/config/database.ts`):
```typescript
import mysql from 'mysql2/promise'
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'smart_workforce',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+07:00',  // required for UTC+7
})
export default pool
```

**Pattern B — SELECT result** (mysql2 returns tuple `[rows, fields]`, not `{ rows }`):
```typescript
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
const user = (rows as any[])[0]
if (!user) throw new Error('USER_NOT_FOUND')
```

**Pattern C — INSERT with UUID** (no `RETURNING` — MySQL does not support it):
```typescript
import { v4 as uuidv4 } from 'uuid'

const id = uuidv4()  // generate UUID in TypeScript BEFORE INSERT
await pool.query(
  'INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)',
  [id, email, fullName, role]
)
// id is already known — no need to re-query
```

**Pattern D — UPDATE with JOIN** (MySQL does not support `UPDATE ... FROM` like PostgreSQL):
```sql
-- MySQL: use UPDATE ... JOIN instead of UPDATE ... FROM
UPDATE attendance a
JOIN shifts s ON a.shift_id = s.id
SET a.hours_worked = TIMESTAMPDIFF(SECOND, a.check_in_time, ?) / 3600,
    a.early_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, ?, s.end_time))
WHERE a.id = ?
```

**Pattern E — Conflict detection** (MySQL has no `OVERLAPS` operator):
```sql
-- Manual overlap check:
WHERE NOT (s.end_time <= ? OR s.start_time >= ?)
  AND sr.student_id = ?
  AND sr.status IN ('pending', 'approved')
-- Params: [proposedEndTime, proposedStartTime, studentId]
```

**Pattern F — Unique constraint error** (MySQL error code differs from PostgreSQL):
```typescript
// PostgreSQL: err.code === '23505'
// MySQL:
if ((err as any).code === 'ER_DUP_ENTRY') {
  return res.status(409).json({ error: 'ALREADY_REGISTERED' })
}
```

**Pattern G — JSON array column** (`skills`, `required_skills`):
```typescript
// Insert: serialize array → JSON string
await pool.query('UPDATE student_profiles SET skills = ? WHERE user_id = ?',
  [JSON.stringify(skills), userId])

// Read: mysql2 auto-parses JSON columns, but a defensive check is still needed:
const skills: string[] = typeof profile.skills === 'string'
  ? JSON.parse(profile.skills)
  : profile.skills ?? []
```

### Shift Status Transitions (fully automatic)
```
open    → full      : When shift.current_workers == shift.max_workers (after each approval)
full    → open      : When student cancels an approved registration (current_workers drops below max_workers)
open/full → ongoing : Background job at shift.start_time (checks every minute)
ongoing → completed : Background job at shift.end_time (checks every minute)
any     → cancelled : Employer calls DELETE /api/shifts/:id — automatically notifies students
```

### Payroll total_pay Clamp
```
total_pay = GREATEST(0, base_pay + bonus - penalty)
-- total_pay cannot be negative. If penalty > base_pay + bonus → total_pay = 0
```

### Employer Cancel Shift
```
When employer calls DELETE /shifts/:id:
  - All shift_registrations with status=approved/pending → cancelled
  - Students are NOT penalized in reputation (employer cancelled)
  - Notification sent to all registered students
```

### Health Check
```
GET /api/health → 200 { "status": "ok", "db": "connected", "uptime": 12345 }
                → 503 { "status": "error", "db": "disconnected" } if DB is unreachable
```
