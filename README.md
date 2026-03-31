# Smart Workforce Platform

A workforce management and automation system for part-time students.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL 8
- **Auth**: JWT (7-day expiry, role encoded in payload)
- **Realtime**: Socket.io
- **Background Jobs**: node-cron

## Technical Design

### System Architecture

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
│                     API GATEWAY / EXPRESS APP                     │
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
│  │   Socket.io Server   │   │   Background Jobs    │             │
│  │  (realtime events)   │   │     (node-cron)      │             │
│  └──────────────────────┘   └──────────────────────┘             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                         DATA LAYER                                │
│                                                                   │
│              ┌─────────────────────┐                             │
│              │      MySQL 8        │                             │
│              │  (primary database) │                             │
│              └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

### Database Schema

| Table | Key Columns | Relationships |
|-------|-------------|---------------|
| `users` | id, email, password_hash, full_name, role (`student\|employer\|admin`), is_active | Base entity for all auth |
| `employer_profiles` | id, user_id, company_name, address | 1:1 with users (role=employer) |
| `student_profiles` | id, user_id, employer_id, student_id, skills (JSON), reputation_score | 1:1 with users; many students belong to 1 employer |
| `jobs` | id, employer_id, title, hourly_rate, required_skills (JSON), status (`active\|paused\|closed`) | 1:many shifts |
| `shifts` | id, job_id, employer_id, start_time, end_time, max_workers, current_workers, status (`open\|full\|ongoing\|completed\|cancelled`) | 1:many shift_registrations, attendance |
| `shift_registrations` | id, shift_id, student_id, status (`pending\|approved\|rejected\|cancelled`), reviewed_by | UNIQUE(shift_id, student_id) |
| `attendance` | id, shift_id, student_id, check_in_time, check_out_time, status (`on_time\|late\|absent\|incomplete\|pending`), late_minutes, early_minutes, hours_worked | 1:1 with shift_registration |
| `payroll` | id, student_id, employer_id, period_start, period_end, total_hours, total_amount, status (`draft\|confirmed\|paid`) | 1:many payroll_items |
| `payroll_items` | id, payroll_id, shift_id, attendance_id, scheduled_hours, hours_worked, hourly_rate, deduction_amount, subtotal | Per-shift breakdown within a payroll period |
| `notifications` | id, user_id, type, title, body, is_read, metadata (JSON) | Push messages to user |
| `ratings` | id, shift_id, student_id, employer_id, score (1–5), comment | UNIQUE(shift_id, student_id) |
| `reputation_events` | id, student_id, event_type, delta, reason | Audit log of reputation changes |

**Schema notes**: Primary keys use `CHAR(36) DEFAULT (UUID())`; timestamps use `DATETIME` (UTC+7, no conversion); arrays use `JSON`; charset `utf8mb4_unicode_ci`.

### Socket.io Event Map

**Server → Client:**

| Event | Payload | Recipient |
|-------|---------|-----------|
| `notification:new` | `{ id, type, title, body, metadata }` | Specific user |
| `attendance:update` | `{ shift_id, student_id, status, check_in_time }` | Employer |
| `shift:registered` | `{ shift_id, student_id, student_name }` | Employer |
| `shift:approved` | `{ shift_id, registration_id }` | Student |
| `shift:rejected` | `{ shift_id, registration_id, reason }` | Student |
| `shift:low_registration` | `{ shift_id, title, current_count, max_workers }` | Employer |
| `payroll:updated` | `{ payroll_id, total_amount, period }` | Student |
| `shift:reminder` | `{ shift_id, start_time, job_title }` | Student |

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join:room` | `{ room: 'user_<id>' }` | Join personal room |
| `join:shift` | `{ shift_id }` | Employer monitors a shift in real-time |

Room strategy: `user_<userId>` (personal notifications) · `shift_<shiftId>` (shift monitoring).

### Business Formulas

**Payroll (Deduction Model):**

```
scheduled_pay   = shift_duration_hours × hourly_rate
late_deduction  = (late_minutes / 60) × hourly_rate
early_deduction = (early_minutes / 60) × hourly_rate
total_pay       = scheduled_pay − late_deduction − early_deduction
```

- `late_minutes` = time arrived late relative to `shift.start_time`
- `early_minutes` = time left early relative to `shift.end_time`
- Attendance `incomplete` (no checkout) → `hours_worked = 0`, `total_pay = 0`
- Negative result is clamped to 0

**Reputation Scoring** (scale 0–200, starting at 100):

| Event | Score |
|-------|-------|
| On-time check-in | +2.0 |
| Complete full shift | +3.0 |
| Good rating from employer (4–5 stars) | +5.0 |
| Late 1–15 minutes | −2.0 |
| Late >15 minutes | −5.0 |
| Absent (no-show) | −10.0 |
| Cancel approved shift (<24h before start) | −7.0 |
| Cancel approved shift (≥24h before start) | 0 |
| Bad rating from employer (1–2 stars) | −8.0 |

Auto-assign eligibility: ≥150 high priority · 100–149 normal · 50–99 low · <50 blocked.

### Module Structure

**Backend** — each feature is a self-contained folder under `backend/src/modules/`:

```
modules/<name>/
  <name>.router.ts      # Express routes (authMiddleware + roleGuard)
  <name>.controller.ts  # req/res handling, calls service
  <name>.service.ts     # business logic + raw mysql2 queries
  <name>.schema.ts      # Zod validation schemas
```

| Module | Main functionality |
|--------|--------------------|
| `auth` | Login, profile; employer self-registers, student created by employer |
| `job` | CRUD jobs; employer manages job listings |
| `shift` | CRUD shifts, shift registration, auto-assign weekly |
| `attendance` | Check-in/out, late detection, force-checkout |
| `payroll` | Calculate payroll by period, aggregate payroll_items |
| `notification` | Send and read real-time notifications |
| `report` | Statistics on shifts, attendance, payroll with charts |
| `admin` | Manage users across the platform, create employers, view all data |

**Background jobs** (`backend/src/jobs/`):

| File | Schedule | Functionality |
|------|----------|--------------|
| `autoAssignShift.ts` | `0 0 * * 1` (Monday 00:00) | Auto-assign pending registrations by reputation score |
| `autoCalcPayroll.ts` | Triggered after checkout + `0 0 * * *` fallback | Create payroll_item, update monthly payroll |
| `sendReminders.ts` | `*/30 * * * *` | Send shift reminders, detect absents, alert for understaffed shifts |

**Frontend** — pages split by role under `frontend/src/pages/`:

```
pages/
  auth/        # Login, Register
  student/     # Dashboard, Schedule, Payroll, Profile
  employer/    # Dashboard, Jobs, Shifts, Attendance, Reports
  admin/       # Users, Statistics
```

State managed via Zustand (`store/`). API calls via axios instance at `api/client.ts` (auto-attaches `Authorization: Bearer <token>`, redirects to `/login` on 401).

---

## Quick Start

### Requirements
- Node.js 20.x LTS
- MySQL 8.x
- npm 10.x

### Manual Setup

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in DB password and JWT secret
npm install
npm run migrate             # create tables
npm run seed                # seed test data
npm run dev                 # http://localhost:3001

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Docker Setup

```bash
docker-compose up -d
# Backend automatically runs migrate on startup
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin123! |
| Employer | employer1@test.com | Employer123! |
| Student | student1@test.com | Student123! |
| Student | student2@test.com | Student123! |

## Documentation

See the `docs/` directory for details:

- `docs/01-system-design.md` — Architecture, DB schema, Socket events
- `docs/02-project-init.md` — Environment setup, directory structure
- `docs/03-backend.md` — API endpoints, business logic
- `docs/04-frontend.md` — Routes, components, UI flows
- `docs/05-testing.md` — Test cases, test data
- `docs/06-deployment.md` — Docker, CI/CD, deployment checklist

## Scripts

### Backend
```bash
npm run dev          # dev server (tsx watch)
npm run build        # TypeScript compile
npm run start        # run production build
npm run migrate      # run DB migrations
npm run migrate:down # rollback 1 migration
npm run seed         # seed test data
npm run test         # Jest tests
npm run lint         # ESLint
```

### Frontend
```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run test         # Vitest
npm run test:e2e     # Playwright e2e
npm run lint         # ESLint
```
