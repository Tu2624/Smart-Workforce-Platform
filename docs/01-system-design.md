# 01 — System Design
## Smart Workforce Platform

## Role

**Persona**: Database Architect & Systems Designer
**Primary Focus**: Canonical data model, system architecture, data flows, and business calculation formulas.
**Perspective**: Every decision here is the source of truth that all other layers must follow. When designing or editing this file, think in terms of data integrity, referential constraints, and downstream contract obligations — not implementation convenience.

### Responsibilities
- Define and maintain DB schema (table structure, data types, constraints, indexes)
- Own all data flow diagrams (shift registration, check-in, payroll, auto-assign)
- Define Socket.io event map (event names, payload shapes, recipients)
- Define business formulas: payroll calculation, reputation score algorithm
- Establish enum value sets that Zod schemas in backend and Badge components in frontend depend on

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Add or rename a DB column | `docs/03-backend.md` | API response shapes and Zod schemas must reflect the change |
| Add or rename a DB column | `docs/04-frontend.md` | TypeScript interfaces in `frontend/src/types/` must stay in sync |
| Add/modify Socket.io event | `docs/04-frontend.md` §6 | Frontend socket hooks listen for the exact event names defined here |
| Change payroll formula (§7) | `docs/05-testing.md` §2 | `payrollCalc.test.ts` encodes specific formula values |
| Change reputation delta | `docs/05-testing.md` §2 | `reputationCalc.test.ts` asserts specific numbers |
| Add new enum value (e.g. shift status) | `docs/03-backend.md` §2 | Zod schemas validate against enum set; `docs/04-frontend.md` Badge.tsx maps colors by enum |
| Change foreign key or cascade rule | `docs/02-project-init.md` | Migration file order and rollback plan must be updated |

### Files to Consult First
- `docs/03-backend.md` — verify API contract is consistent with schema changes
- `docs/04-frontend.md` — verify TypeScript types and socket hook event names are in sync
- `docs/05-testing.md` — update test assertions when formula constants change

---

## 1. System Overview

**Smart Workforce Platform** is a workforce management and automation system for part-time students. The system allows businesses to create jobs, manage shifts, track attendance, and calculate payroll automatically; students can register for shifts, check in/out, and view their earnings in real-time.

### Actors
| Actor | Description |
|-------|-------------|
| **Student** | Part-time student: registers for shifts, checks in/out, views payroll, receives notifications |
| **Employer** | Business: creates jobs, manages shifts, approves applicants, calculates payroll, exports reports |
| **Admin** | System administrator: manages users, jobs, views system-wide statistics |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                   │
│   ┌──────────────────┐         ┌──────────────────┐              │
│   │  Student App     │         │  Employer/Admin  │              │
│   │  (React + TW)    │         │  App (React + TW)│              │
│   └────────┬─────────┘         └────────┬─────────┘              │
│            │ REST API + JWT              │ REST API + JWT         │
│            │ Socket.io                  │ Socket.io              │
└────────────┼────────────────────────────┼────────────────────────┘
             │                            │
┌────────────▼────────────────────────────▼────────────────────────┐
│                        API GATEWAY / EXPRESS APP                  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Auth   │ │   Job    │ │  Shift   │ │Attendance│            │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Payroll  │ │  Notif   │ │  Report  │ │  Admin   │            │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│  ┌──────────────────────┐   ┌──────────────────────┐             │
│  │   Socket.io Server   │   │  Background Jobs      │             │
│  │  (realtime events)   │   │  (node-cron / BullMQ) │             │
│  └──────────────────────┘   └──────────────────────┘             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        DATA LAYER                                 │
│                                                                   │
│              ┌─────────────────────┐                             │
│              │      MySQL 8        │                             │
│              │  (primary database) │                             │
│              └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Main Data Flows

### 3.1 Shift Registration (Student)
```
Employer publishes shifts for the coming week
  → System sends notification to all students: "Next week's shift registration is open"
  → Student opens app, views shift list, selects desired shifts
  → POST /shifts/:id/register → creates shift_registration (status=pending)
  → No conflict check at this step — student may register for overlapping shifts
  → Deadline: Sunday 12:00 noon (scheduler processes after deadline)
  → Employer may manually approve/reject any time during the week
  → Monday 00:00: scheduler automatically processes all remaining pending registrations
  → Student receives outcome notification (approved/rejected)
```

### 3.2 Check-in / Check-out
```
Student → POST /attendance/checkin  { shift_id, location? }
        → Backend: compare actual time vs shift.start_time
        → Calculate late_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, shift.start_time, check_in_time))
        → Determine status: on_time (late_minutes ≤ 5) | late (late_minutes > 5)
        → Save attendance record
        → Emit Socket.io event: attendance:update → Employer dashboard
```

### 3.3 Automatic Payroll Calculation
```
Background Job (daily 00:00 or when shift ends)
  → Query completed attendance records in the period
  → hours_worked = TIMESTAMPDIFF(SECOND, check_in_time, check_out_time) / 3600
               (capped at shift duration if check_out_time > shift.end_time)
  → hourly_rate × hours_worked (actual time)
  → Save payroll record
  → Emit Socket.io: payroll:updated → Student receives payroll notification
```

### 3.4 Weekly Scheduling Job (Auto-assign)
```
Weekly scheduling cycle:

1. Employer creates shifts for the coming week (any time during the week)
2. Student registers for desired shifts (deadline: Sunday 12:00 noon)
   → Student MAY register for overlapping shifts — system does not block
   → Before 12:00 noon: if any shift has no registrations → system alerts employer
3. Background Job runs at Monday 00:00:
   a. Collect all shift_registrations with status=pending for the coming week
   b. For each shift with more registrants than max_workers:
      → Prioritize students with higher reputation_score
      → Ties within same score band: prioritize earlier registration (registered_at)
   c. Check conflict: student cannot be assigned 2 overlapping shifts
   d. Approved: update status=approved, increment shift.current_workers
   e. Rejected: update status=rejected (exceeds max_workers or conflict)
   f. Send notification to all students (approved or rejected)
4. Employer reviews results and may manually adjust
```

---

## 4. Database Schema (ERD)

> **Database**: MySQL 8.0+, charset `utf8mb4`
>
> **Common conventions for all tables**:
> - `CHAR(36) DEFAULT (UUID())` — parentheses around `UUID()` are **required** in MySQL; without them MySQL interprets it as a column name
> - `DATETIME` instead of `TIMESTAMPTZ` — stores UTC+7 directly, no timezone conversion
> - `JSON` instead of `TEXT[]` and `JSONB` — MySQL 8 has a JSON column type
> - Foreign keys declared **at the end of the table** using `FOREIGN KEY (...) REFERENCES ...` (not inline as in PostgreSQL)
> - Each `CREATE TABLE` ends with `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`

### Table `users`
```sql
CREATE TABLE users (
  id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          ENUM('student', 'employer', 'admin') NOT NULL,
  avatar_url    TEXT,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    DATETIME     DEFAULT NOW(),
  updated_at    DATETIME     DEFAULT NOW() ON UPDATE NOW()
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
> `ON UPDATE NOW()` — MySQL auto-updates `updated_at` when a row changes; no trigger needed

### Table `employer_profiles`
```sql
CREATE TABLE employer_profiles (
  id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36)     NOT NULL,
  company_name  VARCHAR(255) NOT NULL,
  address       TEXT,
  description   TEXT,
  created_at    DATETIME     DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `student_profiles`
```sql
CREATE TABLE student_profiles (
  id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id          CHAR(36)     NOT NULL,
  employer_id      CHAR(36),                   -- employer managing this student (1 student belongs to 1 employer)
  student_id       VARCHAR(50),                -- student ID number
  university       VARCHAR(255),
  skills           JSON,                       -- skills array, e.g.: ["communication","agility"]
  reputation_score DECIMAL(5,2) DEFAULT 100.00,
  total_shifts_done INT         DEFAULT 0,
  created_at       DATETIME     DEFAULT NOW(),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employer_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `jobs`
```sql
CREATE TABLE jobs (
  id              CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  employer_id     CHAR(36)      NOT NULL,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT,
  hourly_rate     DECIMAL(10,2) NOT NULL,
  required_skills JSON,                        -- required skills array
  max_workers     INT           NOT NULL,
  status          ENUM('active', 'paused', 'closed') DEFAULT 'active',
  created_at      DATETIME      DEFAULT NOW(),
  updated_at      DATETIME      DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `shifts`
```sql
CREATE TABLE shifts (
  id              CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  job_id          CHAR(36)  NOT NULL,
  employer_id     CHAR(36)  NOT NULL,
  title           VARCHAR(255),
  start_time      DATETIME  NOT NULL,
  end_time        DATETIME  NOT NULL,
  max_workers     INT       NOT NULL,
  current_workers INT       DEFAULT 0,
  status          ENUM('open', 'full', 'ongoing', 'completed', 'cancelled') DEFAULT 'open',
  auto_assign     BOOLEAN   DEFAULT FALSE,
  created_at      DATETIME  DEFAULT NOW(),
  FOREIGN KEY (job_id)      REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (employer_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `shift_registrations`
```sql
CREATE TABLE shift_registrations (
  id            CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  shift_id      CHAR(36)  NOT NULL,
  student_id    CHAR(36)  NOT NULL,
  status        ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  registered_at DATETIME  DEFAULT NOW(),
  reviewed_at   DATETIME,
  reviewed_by   CHAR(36),
  UNIQUE (shift_id, student_id),
  FOREIGN KEY (shift_id)    REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `attendance`
```sql
CREATE TABLE attendance (
  id                CHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  shift_id          CHAR(36)   NOT NULL,
  student_id        CHAR(36)   NOT NULL,
  check_in_time     DATETIME,
  check_out_time    DATETIME,
  status            ENUM('on_time', 'late', 'absent', 'incomplete', 'pending') DEFAULT 'pending',
  late_minutes      INT        DEFAULT 0,   -- minutes late relative to shift.start_time
  early_minutes     INT        DEFAULT 0,   -- minutes early relative to shift.end_time
  hours_worked      DECIMAL(5,2),           -- = shift_duration_hours - (late_minutes + early_minutes) / 60
  force_checkout    BOOLEAN    DEFAULT FALSE,
  force_checkout_by CHAR(36),               -- employer_id who performed force-checkout
  note              TEXT,
  created_at        DATETIME   DEFAULT NOW(),
  FOREIGN KEY (shift_id)          REFERENCES shifts(id),
  FOREIGN KEY (student_id)        REFERENCES users(id),
  FOREIGN KEY (force_checkout_by) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- incomplete = student checked in but shift ended without checkout; hours_worked = 0
```

### Table `payroll`
```sql
CREATE TABLE payroll (
  id           CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  student_id   CHAR(36)      NOT NULL,
  employer_id  CHAR(36)      NOT NULL,
  period_start DATE          NOT NULL,
  period_end   DATE          NOT NULL,
  total_hours  DECIMAL(7,2),
  total_amount DECIMAL(12,2),               -- = SUM(payroll_items.subtotal)
  status       ENUM('draft', 'confirmed', 'paid') DEFAULT 'draft',
  paid_at      DATETIME,
  created_at   DATETIME      DEFAULT NOW(),
  FOREIGN KEY (student_id)  REFERENCES users(id),
  FOREIGN KEY (employer_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `payroll_items` (per-shift breakdown)
```sql
CREATE TABLE payroll_items (
  id                CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  payroll_id        CHAR(36)      NOT NULL,
  shift_id          CHAR(36),
  attendance_id     CHAR(36),
  scheduled_hours   DECIMAL(5,2),             -- original scheduled shift duration
  hours_worked      DECIMAL(5,2),             -- = scheduled_hours - (late_minutes + early_minutes)/60
  hourly_rate       DECIMAL(10,2),
  deduction_minutes INT           DEFAULT 0,  -- late_minutes + early_minutes
  deduction_amount  DECIMAL(12,2) DEFAULT 0,  -- = deduction_minutes/60 × hourly_rate
  subtotal          DECIMAL(12,2),            -- = scheduled_hours × hourly_rate - deduction_amount
  FOREIGN KEY (payroll_id)    REFERENCES payroll(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id)      REFERENCES shifts(id),
  FOREIGN KEY (attendance_id) REFERENCES attendance(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `notifications`
```sql
CREATE TABLE notifications (
  id         CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  type       VARCHAR(50)  NOT NULL,  -- shift_approved, payroll_ready, shift_reminder, etc.
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN      DEFAULT FALSE,
  metadata   JSON,                   -- { shift_id, payroll_id, ... }
  created_at DATETIME     DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `ratings`
```sql
CREATE TABLE ratings (
  id          CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  shift_id    CHAR(36)  NOT NULL,
  student_id  CHAR(36)  NOT NULL,
  employer_id CHAR(36)  NOT NULL,
  score       INT       NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  DATETIME  DEFAULT NOW(),
  UNIQUE (shift_id, student_id),              -- each shift can only be rated once
  FOREIGN KEY (shift_id)    REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Table `reputation_events`
```sql
CREATE TABLE reputation_events (
  id         CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36)     NOT NULL,
  event_type VARCHAR(50),  -- on_time_checkin, late_checkin, absent, good_review, etc.
  delta      DECIMAL(5,2), -- +2.0, -5.0, etc.
  reason     TEXT,
  created_at DATETIME     DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. Socket.io Event Map

### Server → Client Events
| Event | Payload | Recipient |
|-------|---------|-----------|
| `notification:new` | `{ id, type, title, body, metadata }` | Specific user |
| `attendance:update` | `{ shift_id, student_id, status, check_in_time }` | Employer |
| `shift:registered` | `{ shift_id, student_id, student_name, registered_at }` | Employer (shift room) |
| `shift:approved` | `{ shift_id, registration_id }` | Student |
| `shift:rejected` | `{ shift_id, registration_id, reason }` | Student |
| `shift:low_registration` | `{ shift_id, title, current_count, max_workers }` | Employer |
| `payroll:updated` | `{ payroll_id, total_amount, period }` | Student |
| `shift:reminder` | `{ shift_id, start_time, job_title }` | Student |

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join:room` | `{ room: 'user_<id>' }` | User joins personal room |
| `join:shift` | `{ shift_id }` | Employer joins shift monitoring room |

---

## 6. Reputation Score Algorithm

**Starting score**: 100.00 (scale 0–200)

### Positive events
| Event | Delta |
|-------|-------|
| On-time check-in | +2.0 |
| Complete full shift | +3.0 |
| Good rating from employer (4–5 stars) | +5.0 |

### Negative events
| Event | Delta |
|-------|-------|
| Late (1–15 minutes) | -2.0 |
| Late (>15 minutes) | -5.0 |
| No-show without notice | -10.0 |
| Cancel approved shift (<24h before start) | -7.0 |
| Cancel approved shift (≥24h before start) | 0 (no penalty) |
| Bad rating from employer (1–2 stars) | -8.0 |

> **Note**: If the EMPLOYER cancels the shift (not the student), the student's reputation is NOT affected.

### Effect on auto-assign
- Score ≥ 150: Highest priority
- Score 100–149: Normal priority
- Score 50–99: Low priority
- Score < 50: Auto-assign blocked

---

## 7. Payroll Formula

```
scheduled_pay    = shift_duration_hours × hourly_rate      -- pay if on time and full shift

late_deduction   = (late_minutes / 60) × hourly_rate       -- deducted for arriving late
early_deduction  = (early_minutes / 60) × hourly_rate      -- deducted for leaving early

total_pay        = scheduled_pay - late_deduction - early_deduction
               ≡  hours_worked × hourly_rate               -- equivalent when implemented
```

**Rules:**
- `late_minutes` = check_in_time - shift.start_time (if > 0, otherwise = 0)
- `early_minutes` = shift.end_time - check_out_time (if > 0, otherwise = 0)
- `hours_worked` = shift_duration - (late_minutes + early_minutes) / 60
- On time and full shift → `total_pay = scheduled_pay` (no deductions)
- No percentage bonus/penalty in payroll
- Reputation is still adjusted per §6 — completely separate from pay
- `incomplete` attendance: `hours_worked = 0`, `total_pay = 0` (shift is unpaid)

### Payroll Period
- `period_start` = 1st of the current month
- `period_end` = last day of the month
- Auto-create: when the first `payroll_item` of the month is created, create the `payroll` record for that month if it does not exist

### Cancel Approved Registration
```
Student cancels a registration with status=approved:
  → registration.status = 'cancelled'
  → shift.current_workers -= 1
  → Slot reopens (shift continues accepting new registrations up to max_workers)
  → Apply reputation penalty per §6 (≥24h = 0, <24h = -7.0)
```

### Force-Checkout (Employer)
```
Preconditions:
  - NOW() > shift.end_time (shift has ended)
  - Student checked in but attendance.status = 'incomplete' (no checkout)
  - employer_id = shift.job.employer_id

Limit: max 3 times / student / calendar month
  - Count attendance records for that student with force_checkout=TRUE in the current month

When executed:
  - check_out_time = NOW()
  - hours_worked = (check_out_time - check_in_time) / 3600
  - early_minutes = MAX(0, shift.end_time - check_out_time) / 60  -- typically 0 since force occurs after shift ends
  - status = 'on_time' or 'late' (based on existing late_minutes)
  - force_checkout = TRUE, force_checkout_by = employer_id
  - Trigger payroll calculation for this attendance record
```
