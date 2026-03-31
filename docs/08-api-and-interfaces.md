# 08 — Key API & TypeScript Interfaces
## Smart Workforce Platform

> **Purpose of this file**: A quick-reference planning note.
> - **Section 1** — All API endpoints that already exist (defined in `03-backend.md`)
> - **Section 2** — All TypeScript interfaces needed (derived from DB schema in `01-system-design.md`)
>
> Status legend:
> - ✅ **Defined** — fully documented in docs, ready to implement
> - 🔲 **To implement** — not yet written as actual code

---

## Section 1 — Key API Endpoints

> Full detail (request body, response shape, error codes) → `docs/03-backend.md`
> This section is a quick-scan reference only.

---

### 1.1 Auth — `/api/auth`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `POST` | `/api/auth/register` | Public | Employer self-registers. Returns `token + user`. |
| ✅ | `POST` | `/api/auth/login` | Public | All roles log in. Returns `token + user`. |
| ✅ | `GET` | `/api/auth/me` | S\|E\|A | Get current user info + their profile. |
| ✅ | `PUT` | `/api/auth/profile` | S\|E | Update name, phone, avatar, skills, university. |
| ✅ | `PUT` | `/api/auth/change-password` | S\|E\|A | Change password (requires current password). |
| ✅ | `POST` | `/api/employers/employees` | E | Employer creates a student account. Returns `temp_password` in response — no email sent. |
| ✅ | `GET` | `/api/employers/employees` | E | List all students belonging to this employer. |

> **Key note**: Students cannot self-register. No `/register` page for them.

---

### 1.2 Jobs — `/api/jobs`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `POST` | `/api/jobs` | E | Create a new job with title, hourly_rate, required_skills. |
| ✅ | `GET` | `/api/jobs` | S\|E | List jobs. Employer sees their own; student sees all active. |
| ✅ | `GET` | `/api/jobs/:id` | S\|E | Get single job details. |
| ✅ | `PUT` | `/api/jobs/:id` | E | Edit job. Only the owner employer can do this. |
| ✅ | `DELETE` | `/api/jobs/:id` | E | Delete job. Only allowed when no active shifts exist. |
| ✅ | `PATCH` | `/api/jobs/:id/status` | E | Switch job status: `active` → `paused` → `closed`. |

---

### 1.3 Shifts — `/api/shifts`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `POST` | `/api/shifts` | E | Create a shift for a job. Sets time, max_workers, auto_assign flag. |
| ✅ | `GET` | `/api/shifts` | S\|E | List shifts. Employer sees their own; student sees all open. |
| ✅ | `GET` | `/api/shifts/:id` | S\|E | Get shift details + list of who registered. |
| ✅ | `PUT` | `/api/shifts/:id` | E | Edit shift (only when status=open). |
| ✅ | `DELETE` | `/api/shifts/:id` | E | Cancel shift. Auto-notifies all registered students. |
| ✅ | `POST` | `/api/shifts/:id/register` | S | Student registers for a shift. No conflict check — overlapping shifts allowed. |
| ✅ | `DELETE` | `/api/shifts/:id/register` | S | Student cancels their registration. Reputation penalty if <24h before shift. |
| ✅ | `POST` | `/api/shifts/:id/assign` | E | Employer manually assigns a student (bypasses auto-assign). |
| ✅ | `GET` | `/api/shifts/:id/registrations` | E | See all students who registered for this shift. |
| ✅ | `PATCH` | `/api/shifts/:id/registrations/:reg_id` | E | Approve or reject a specific registration. |

> **Key notes**:
> - Registration deadline: **Sunday 12:00 noon** — registrations after this are ignored by the scheduler
> - Auto-assign runs: **Monday 00:00** — resolves conflicts, picks by reputation score
> - Status transitions (`open→full→ongoing→completed`) are **fully automatic** via background jobs

---

### 1.4 Attendance — `/api/attendance`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `POST` | `/api/attendance/checkin` | S | Student checks in. Returns `status` (on_time/late) and `late_minutes`. |
| ✅ | `POST` | `/api/attendance/checkout` | S | Student checks out. System calculates `hours_worked`. |
| ✅ | `GET` | `/api/attendance` | S | Student's own attendance history. |
| ✅ | `GET` | `/api/attendance/shift/:shift_id` | E | Employer sees attendance list for a specific shift (real-time). |
| ✅ | `PATCH` | `/api/attendance/:id` | E | Manual override: edit note or status. |
| ✅ | `PATCH` | `/api/attendance/:id/force-complete` | E | Force-checkout a student who forgot. Max **3 times/student/month**. |

> **Key note**: Late if check-in > 5 minutes after shift start. Background job marks absent after 30 min of no check-in.

---

### 1.5 Payroll — `/api/payroll`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `GET` | `/api/payroll` | S | Student views their payroll history by period. |
| ✅ | `GET` | `/api/payroll/:id` | S | Student views one payroll period + all `payroll_items` (per-shift breakdown). |
| ✅ | `GET` | `/api/payroll/employer` | E | Employer sees payroll table for all employees. |
| ✅ | `POST` | `/api/payroll/calculate` | E | Manually trigger payroll calculation for a date range. |
| ✅ | `PATCH` | `/api/payroll/:id/confirm` | E | Move payroll from `draft` → `confirmed`. |
| ✅ | `PATCH` | `/api/payroll/:id/paid` | E | Move payroll from `confirmed` → `paid`. |
| ✅ | `GET` | `/api/payroll/:id/export` | E | Download payroll as PDF or Excel. |

> **Key note**: Payroll is calculated in **real-time** after each shift ends (not in a nightly batch). The `payroll_item` is created immediately; the monthly `payroll` record accumulates them.

---

### 1.6 Notifications — `/api/notifications`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `GET` | `/api/notifications` | S\|E | Get list of notifications (filter: unread). |
| ✅ | `PATCH` | `/api/notifications/:id/read` | S\|E | Mark one notification as read. |
| ✅ | `PATCH` | `/api/notifications/read-all` | S\|E | Mark all notifications as read. |

---

### 1.7 Ratings — `/api/ratings`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `POST` | `/api/ratings` | E | Employer rates a student (1–5 stars) after shift completes. Auto-updates reputation. |
| ✅ | `GET` | `/api/ratings/student/:student_id` | E\|S | View rating history for a student. |

> **Key note**: score 4–5 → +5.0 reputation. score 3 → no change. score 1–2 → −8.0 reputation.

---

### 1.8 Reports — `/api/reports`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `GET` | `/api/reports/overview` | E | Total shifts, total hours, cost this month. |
| ✅ | `GET` | `/api/reports/shifts` | E | Shift stats over a date range. |
| ✅ | `GET` | `/api/reports/performance` | E | Per-employee stats: shift count, on-time rate, reputation. |
| ✅ | `GET` | `/api/reports/payroll-summary` | E | Total labor cost by month (for charts). |

---

### 1.9 Admin — `/api/admin`

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `GET` | `/api/admin/users` | A | List all users with filter by role/status. |
| ✅ | `PATCH` | `/api/admin/users/:id/toggle-status` | A | Lock or unlock any account. |
| ✅ | `GET` | `/api/admin/jobs` | A | View all jobs across all employers. |
| ✅ | `GET` | `/api/admin/stats` | A | System-wide stats: total users, jobs, shifts, revenue. |
| ✅ | `POST` | `/api/admin/employers` | A | Admin creates an employer account. |
| ✅ | `GET` | `/api/admin/employers/:id/shifts` | A | View all shifts for a specific employer. |
| ✅ | `GET` | `/api/admin/employers/:id/payroll` | A | View all payroll records for a specific employer. |
| ✅ | `PATCH` | `/api/admin/payroll/:id` | A | Admin manually overrides a payroll amount. |

---

### 1.10 System

| Status | Method | Path | Who | What it does |
|--------|--------|------|-----|--------------|
| ✅ | `GET` | `/api/health` | Public | Returns DB connection status + uptime. Used by Docker and load balancer. |

---

## Section 2 — TypeScript Interfaces

> These interfaces live in `frontend/src/types/`.
> All of them are **derived from the DB schema** in `docs/01-system-design.md §4`.
> Currently they are referenced throughout `04-frontend.md` (stores, components) but **none have been written as actual `.ts` files yet**.

---

### 2.1 Core Data Models

These are the base shapes returned by the API. Write these first — everything else depends on them.

```typescript
// ✅ Defined in docs — 🔲 Not yet written as code

interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'student' | 'employer' | 'admin'   // Contract A enum
  avatar_url: string | null
  is_active: boolean
  created_at: string
}
// Used by: useAuthStore, LoginPage, Navbar, UserList (admin)

interface EmployerProfile {
  id: string
  user_id: string
  company_name: string
  address: string | null
  description: string | null
}
// Used by: GET /api/auth/me response, ProfilePage (employer)

interface StudentProfile {
  id: string
  user_id: string
  employer_id: string
  student_id: string | null           // student ID number
  university: string | null
  skills: string[]                    // JSON array from DB
  reputation_score: number            // 0–200
  total_shifts_done: number
}
// Used by: GET /api/auth/me response, ProfilePage (student), EmployeeList
```

---

```typescript
interface Job {
  id: string
  employer_id: string
  title: string
  description: string | null
  hourly_rate: number
  required_skills: string[]           // JSON array from DB
  max_workers: number
  status: 'active' | 'paused' | 'closed'   // Contract A enum
  created_at: string
}
// Used by: JobList, JobDetail, ShiftForm (select job), StudentShiftList
```

---

```typescript
interface Shift {
  id: string
  job_id: string
  employer_id: string
  title: string | null
  start_time: string                  // DATETIME stored as UTC+7
  end_time: string
  max_workers: number
  current_workers: number
  status: 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'  // Contract A enum
  auto_assign: boolean
  created_at: string
  job?: Job                           // optionally joined — depends on endpoint
}
// Used by: ShiftList, ShiftCalendar, ShiftCard, ShiftDetail, CheckInButton

interface ShiftRegistration {
  id: string
  shift_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'  // Contract A enum
  registered_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  student?: User                      // optionally joined
}
// Used by: ShiftRegistrationList, useShiftStore.myRegistrations, Badge colors
```

---

```typescript
interface Attendance {
  id: string
  shift_id: string
  student_id: string
  check_in_time: string | null
  check_out_time: string | null
  status: 'on_time' | 'late' | 'absent' | 'incomplete' | 'pending'  // Contract A enum
  late_minutes: number
  early_minutes: number
  hours_worked: number | null
  force_checkout: boolean
  note: string | null
  shift?: Shift                       // optionally joined
}
// Used by: AttendanceRow, CheckInButton, AttendanceOverview (employer realtime)
```

---

```typescript
interface Payroll {
  id: string
  student_id: string
  employer_id: string
  period_start: string                // DATE: "2024-03-01"
  period_end: string                  // DATE: "2024-03-31"
  total_hours: number
  total_amount: number
  status: 'draft' | 'confirmed' | 'paid'   // Contract A enum
  paid_at: string | null
  items?: PayrollItem[]               // optionally joined
}
// Used by: PayrollList, PayrollSummaryCard, PayrollDetail

interface PayrollItem {
  id: string
  payroll_id: string
  shift_id: string
  attendance_id: string
  scheduled_hours: number
  hours_worked: number
  hourly_rate: number
  deduction_minutes: number
  deduction_amount: number
  subtotal: number
  shift?: Shift                       // optionally joined
}
// Used by: PayrollItemRow, PayrollDetail breakdown table
```

---

```typescript
interface Notification {
  id: string
  user_id: string
  type: string                        // 'shift_approved' | 'payroll_ready' | 'shift_reminder' | etc.
  title: string
  body: string | null
  is_read: boolean
  metadata: Record<string, string> | null   // { shift_id, payroll_id, ... }
  created_at: string
}
// Used by: NotificationItem, NotificationBell, useNotificationStore

interface Rating {
  id: string
  shift_id: string
  student_id: string
  employer_id: string
  score: 1 | 2 | 3 | 4 | 5
  comment: string | null
  created_at: string
}
// Used by: POST /api/ratings form, rating history page
```

---

### 2.2 API Response Shapes

Shapes returned by specific endpoints — NOT the same as the data models above.

```typescript
// POST /api/auth/login → POST /api/auth/register
interface AuthResponse {
  token: string
  user: User
}
// Used by: useAuthStore.login() — destructures exactly these 2 fields (Contract B)

// POST /api/employers/employees
interface CreateEmployeeResponse {
  message: string
  user: User
  temp_password: string    // shown once, never emailed — employer copies manually
}

// POST /api/shifts/:id/register
interface RegisterShiftResponse {
  registration: ShiftRegistration
}
// Used by: useShiftStore.registerShift() — updates myRegistrations (Contract B)

// POST /api/attendance/checkin
interface CheckinResponse {
  attendance: Pick<Attendance, 'id' | 'status' | 'late_minutes' | 'check_in_time'>
}
// Used by: CheckInButton.tsx — displays status immediately (Contract B)

// All error responses — always this shape
interface ApiError {
  error: string      // e.g. "ALREADY_REGISTERED", "SHIFT_FULL"
  message: string    // human-readable
  details?: unknown  // Zod validation errors
}
// Used by: apiClient.ts interceptor → toast messages (Contract B)
```

---

### 2.3 Zustand Store Interfaces

Already defined in `docs/04-frontend.md §4`. Repeated here for completeness.

```typescript
// These reference the interfaces above — cannot be written until §2.1 interfaces exist

interface AuthStore {
  user: User | null           // ← depends on User interface
  token: string | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

interface ShiftStore {
  shifts: Shift[]             // ← depends on Shift interface
  myRegistrations: ShiftRegistration[]  // ← depends on ShiftRegistration
  fetchShifts: (filters?: object) => Promise<void>
  registerShift: (shiftId: string) => Promise<void>
  cancelRegistration: (shiftId: string) => Promise<void>
}

interface AttendanceStore {
  todayShift: Shift | null
  isCheckedIn: boolean
  checkIn: (shiftId: string) => Promise<void>
  checkOut: (shiftId: string) => Promise<void>
  history: Attendance[]       // ← depends on Attendance interface
}

interface NotificationStore {
  notifications: Notification[]   // ← depends on Notification interface
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Notification) => void
}
```

---

## Summary — What to Build and in What Order

```
Step 1 — Write frontend/src/types/index.ts
         Define all interfaces from §2.1 in order:
         User → EmployerProfile → StudentProfile
         → Job → Shift → ShiftRegistration
         → Attendance → Payroll → PayrollItem
         → Notification → Rating
         + API response shapes from §2.2

Step 2 — Write frontend/src/store/*.ts
         Now the Zustand stores from §2.3 can be written
         (they import from types/index.ts)

Step 3 — Write frontend/src/api/*.ts
         API functions import types and return typed responses

Step 4 — Write backend service files
         Use MySQL query patterns from docs/03-backend.md §6
         Each service returns shapes that match the interfaces above

Step 5 — Write backend/src/types/ (optional)
         Shared types between backend services if needed
```

> **Do not skip Step 1.** Every store, component, and API function depends on the base interfaces.
> If you define `Shift` differently in two places → TypeScript errors everywhere later.
