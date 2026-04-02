# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Workforce Platform** — A part-time workforce management system for students. Three roles: `admin`, `employer`, `student`. Built as a monorepo with separate `backend/` and `frontend/` directories.

## Current Status

The `backend/` and `frontend/` directories do not yet exist — the project is in the **documentation/planning phase**. All specs are in `docs/`; implementation has not started. When scaffolding begins, follow `docs/02-project-init.md` for migration order (FK dependencies matter).

## Commands

### First-time setup
```bash
cd backend && cp .env.example .env   # fill DB password + JWT secret
cd frontend && cp .env.example .env
```

### Backend (`cd backend`)
```bash
npm run dev          # tsx watch — hot reload at http://localhost:3001
npm run build        # tsc compile to dist/
npm run migrate      # run pending DB migrations (db-migrate up)
npm run migrate:down # rollback last migration (db-migrate down, 1 at a time)
npm run seed         # seed test data
npm run test         # Jest (runs from backend/tests/, always --runInBand)
npm run test:watch   # Jest watch mode
npm run lint         # ESLint on src/

# Run a single test file
npx jest tests/payrollCalc.test.ts
npx jest tests/attendance.test.ts --verbose
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc + vite build
npm run test         # Vitest
npm run test:e2e     # Playwright e2e
npm run lint         # ESLint on src/
npm run format       # Prettier (semi:false, single quotes, trailing comma)

# Run a single test file
npx vitest run src/components/Badge.test.tsx
```

### Docker (full stack)
```bash
docker-compose up -d   # starts mysql + backend (auto-migrates) + frontend
```

## Architecture

### Backend (`backend/src/`)

**Module structure** — each feature is a self-contained folder under `modules/`:
```
modules/<name>/
  <name>.router.ts      # Express routes with authMiddleware + roleGuard
  <name>.controller.ts  # req/res handling, calls service
  <name>.service.ts     # business logic + raw mysql2 queries
  <name>.schema.ts      # Zod validation schemas
```

Modules: `auth`, `job`, `shift`, `attendance`, `payroll`, `notification`, `report`, `admin`

**Entry point** `src/app.ts` — wires Express, Socket.io, all routers, error handler, and starts background cron jobs.

**Auth flow** — JWT-based. `authMiddleware` verifies Bearer token and attaches `req.user: { id, email, role }`. `roleGuard(...roles)` restricts routes by role. Both are applied per-router, not globally.

**Database** — raw `mysql2` (no ORM). `src/config/database.ts` exports a pool via `mysql2/promise`. Services use `const [rows] = await pool.query(...)` — result is a tuple, not `{rows}`. Schema is managed via `db-migrate` files in `migrations/`.

**Realtime** — Socket.io initialized in `src/config/socket.ts`. Use `notifyUser(userId, event, data)` or `notifyShiftRoom(shiftId, event, data)` from any service. Clients join personal rooms (`user_<id>`) and shift rooms (`shift_<id>`).

**Background jobs** (`src/jobs/`):
- `autoAssignShift.ts` — cron `0 0 * * 1` (Monday 00:00); auto-assign pending registrations
- `autoCalcPayroll.ts` — triggered real-time after checkout; fallback cron `0 0 * * *`
- `sendReminders.ts` — cron `*/30 * * * *`; integrates `autoDetectAbsent` and `lowRegistrationAlert`

**Utilities** (`src/utils/`):
- `conflictCheck.ts` — shift overlap detection
- `payrollCalc.ts` — wage calculation logic
- `reputationCalc.ts` — student reputation scoring

### Frontend (`frontend/src/`)

**State** — Zustand stores in `store/`. `authStore.ts` uses `persist` middleware (localStorage key `auth-store`). JWT token is also stored directly in `localStorage` under key `token`.

**API layer** — `api/client.ts` is an axios instance that auto-attaches `Authorization: Bearer <token>` and redirects to `/login` on 401. Individual resource modules (`api/jobs.ts`, `api/shifts.ts`, etc.) import this client.

**Routing** — React Router v6, pages split by role under `pages/admin/`, `pages/employer/`, `pages/student/`, `pages/auth/`.

**Sockets** — `hooks/useSocket.ts` and `hooks/useNotificationSocket.ts` wrap socket.io-client. Components use these hooks to subscribe to real-time events.

**Env vars** — `VITE_API_URL` (default `/api`) and `VITE_SOCKET_URL` configure the backend connection.

## Documentation System

All specs live in `docs/`. When implementing a feature, **start here before writing code**:

| File | What's authoritative here |
|------|--------------------------|
| `docs/01-system-design.md` | DB schema, ERD, Socket.io event map, payroll formula, reputation scoring |
| `docs/02-project-init.md` | Env vars, migration order (FK dependencies), git workflow, dependency table |
| `docs/03-backend.md` | REST endpoint specs, middleware behavior, background job logic, business rules |
| `docs/04-frontend.md` | Route map, Zustand store interfaces, API module functions, socket hooks, UX flows |
| `docs/05-testing.md` | Unit/integration/E2E test cases, seed data, coverage targets |
| `docs/06-deployment.md` | Docker config, CI/CD, ENV production checklist, release gates |
| `docs/07-mysql-guide.md` | MySQL 8 setup, syntax differences from PostgreSQL, charset/UUID/DATETIME guidance |
| `docs/08-api-and-interfaces.md` | Quick-reference index of all API endpoints (✅/🔲 status) and TypeScript interfaces derived from DB schema |
| `docs/system-overview.md` | Cross-layer contracts, feature impact matrix, decisions log |

Use the **Feature Impact Matrix** in `docs/system-overview.md` to identify which docs files to update for any given change.

## Four Cross-Layer Contracts

Changes that cross these boundaries require updating **both sides**:

**Contract A — DB enum ↔ all layers**: These enum values appear in DB schema, Zod validation, TypeScript types, Badge color maps, and test assertions simultaneously:
- `users.role`: `student | employer | admin`
- `shift_registrations.status`: `pending | approved | rejected | cancelled`
- `attendance.status`: `on_time | late | absent | incomplete | pending`
- `payroll.status`: `draft | confirmed | paid`

**Contract B — API endpoint ↔ Frontend API module**: Every endpoint in `docs/03-backend.md` has a direct counterpart in `frontend/src/api/*.ts`. Error shape is always `{ error: "ERROR_CODE", message: "..." }`.

**Contract C — Socket.io event ↔ Frontend hook**: Event names defined in `docs/01-system-design.md §5` are the single source of truth. Events: `notification:new`, `attendance:update`, `shift:registered`, `shift:approved`, `shift:rejected`, `shift:low_registration`, `payroll:updated`, `shift:reminder`.

**Contract D — Business rule constant ↔ test assertion**: Constants defined in `docs/01-system-design.md` must match implementation in utils and test assertions simultaneously.

Payroll formula (Decision #18 — deduction model):
```
scheduled_pay   = shift_duration_hours × hourly_rate
late_deduction  = (late_minutes / 60) × hourly_rate
early_deduction = (early_minutes / 60) × hourly_rate
total_pay       = MAX(0, scheduled_pay − late_deduction − early_deduction)
```
`incomplete` attendance (no checkout) → `hours_worked = 0`, `total_pay = 0`.

Late detection threshold: 5 min (defined in `03-backend.md`, not `01-system-design.md`).

Reputation deltas (scale 0–200, default 100):
| Event | Delta |
|-------|-------|
| Check-in on time | +2.0 |
| Complete full shift | +3.0 |
| Good rating from employer (4–5 stars) | +5.0 |
| Late 1–15 min | −2.0 |
| Late >15 min | −5.0 |
| Absent | −10.0 |
| Cancel approved shift <24h before start | −7.0 |
| Bad rating from employer (1–2 stars) | −8.0 |

Score <50 blocks auto-assign eligibility. ≥150 = high priority, 100–149 = normal, 50–99 = low.

See `docs/system-overview.md §9` for the full decisions log (22 confirmed architectural decisions as of 2026-03-27).

## Key Design Decisions

- **No ORM**: all SQL is written manually in service files. Use `?` placeholders (mysql2 syntax) — never string interpolation.
- **UUID before INSERT**: generate UUID with `uuid` package in TypeScript before INSERT; MySQL has no `RETURNING`. `const id = uuidv4()` → pass to INSERT.
- **Validation at router level**: Zod schemas in `*.schema.ts` are applied as middleware before controllers.
- **Tests live in `backend/tests/`** (not co-located with source). Jest runs with `--runInBand` to avoid DB connection race conditions.
- **Migrations are append-only**: never edit existing migration files; always add a new one.
- **Student creation**: employers create students via `POST /api/employers/employees`; students do NOT self-register. Temp password is returned only in the API response (no email service).
- **Student belongs to one employer**: `student_profiles.employer_id` is a hard binding — no marketplace/multi-employer model.
- **No conflict check at registration**: students may register for overlapping shifts freely; the weekly scheduler (Monday 00:00) resolves conflicts using reputation priority. Registration deadline is **Sunday 12:00 noon**.
- **Payroll is real-time**: a `payroll_item` is created immediately after shift checkout and accumulated into the calendar-month `payroll` record. Students see earnings update after every shift.
- **Force-checkout**: employer can remotely checkout a student (marks `incomplete`) max **3 times per student per month** to prevent abuse.

## Test Accounts (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin123! |
| Employer | employer1@test.com | Employer123! |
| Student | student1@test.com | Student123! |
| Student | student2@test.com | Student123! |

## Known Inconsistencies

- `README.md` (and `docs/system-overview.md §1` stack summary) still references driver `pg` — this is outdated. The actual database is **MySQL 8** with driver `mysql2`. Use `?` placeholders (not `$1`), `CHAR(36) DEFAULT (UUID())` primary keys, and `db-migrate` for migrations. See `docs/07-mysql-guide.md` for the full MySQL-vs-PostgreSQL diff.
- `docs/system-overview.md §5` (Contract D table) lists percentage-based payroll constants (bonus 5%, penalty 2%/5%) that predate Decision #18. The definitive formula is the **deduction model** documented above under Contract D.

## Skills (Slash Commands)

Three shortcut commands for working correctly. Type directly in the Claude Code chat.

### `/feature <feature name>`
**When to use**: Before implementing any feature — even small ones.

Reads `docs/system-overview.md`, consults the Feature Impact Matrix, and generates a concrete 6-step checklist for that feature. Required step before writing code.

```
/feature auth and account registration
/feature shift management (shift CRUD)
/feature check-in check-out with late detection
/feature automatic payroll calculation
```

### `/check`
**When to use**: Before `git commit` — after completing a feature or a major section.

Verifies that the 4 cross-layer contracts (DB↔API, API↔Frontend, Socket↔Hook, Rule↔Test) are not broken. Reports ✅ / ⚠️ / ❌ for each contract.

```
/check
/check after adding a new enum value for shift status
```

### `/contracts <topic>`
**When to use**: When touching the 4 most sensitive areas — auth/JWT, enum values, Socket.io events, business rule constants.

Loads cross-layer awareness and lists exactly what to check before making changes.

```
/contracts JWT token and role guard
/contracts attendance.status enum
/contracts socket event shift:approved
/contracts payroll deduction formula
```

### Workflow for each feature

```
1. /feature <name>         ← read context, get checklist
2. ... implement code ...
3. /contracts <topic>      ← when touching auth/enum/socket/rule
4. /check                  ← before committing
5. git commit
```
