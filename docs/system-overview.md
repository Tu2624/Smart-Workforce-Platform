# System Overview
## Smart Workforce Platform

## Role

**Persona**: Technical Lead (Multi-Role Coordinator)
**Primary Focus**: Cross-cutting concerns, inter-layer contracts, architectural decisions, and the dependency map between all docs files.
**Perspective**: This is the entry point for understanding the entire system. The Technical Lead is simultaneously aware of all roles: when thinking about a DB schema change, immediately sees API contracts, TypeScript types, test assertions, and deployment implications. When starting any feature, begin here to understand which files are affected before opening them.

### How to Use This Document
1. Identify the feature or change being implemented.
2. Find it in the **Feature Impact Matrix** below.
3. Open only the files listed in that row — in the order listed.
4. Apply the role defined at the top of each file when working within it.
5. Return here to verify all cross-cutting concerns have been addressed before closing the work.

### Files Governed by This Overview
| File | Role Persona | Primary Domain |
|------|-------------|----------------|
| `docs/01-system-design.md` | Database Architect & Systems Designer | Schema, data flows, formulas, Socket.io event map |
| `docs/02-project-init.md` | DevOps Engineer & Project Scaffolder | Repo structure, env vars, dependencies, migrations, git workflow |
| `docs/03-backend.md` | Backend Engineer & API Contract Owner | REST endpoints, middleware, socket emission, background jobs, business rules |
| `docs/04-frontend.md` | Frontend Engineer & UI/UX Architect | Routes, components, Zustand stores, API layer, socket hooks, UX flows |
| `docs/05-testing.md` | QA Engineer & Test Architect | Unit tests, integration tests, E2E tests, seed data, coverage targets |
| `docs/06-deployment.md` | DevOps & Release Engineer | Docker, CI/CD, ENV checklist, migration safety, release gates |

---

## 1. System Architecture Summary

**Stack**:
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite, served via nginx in production
- Backend: Node.js + Express + TypeScript, raw `mysql2` (no ORM), Socket.io for realtime
- Database: MySQL 8
- Auth: JWT (Bearer token), 7-day expiry, role encoded in payload
- Realtime: Socket.io rooms per user (`user_<id>`) and per shift (`shift_<id>`)
- Background Jobs: node-cron (daily payroll calc, reminders every 30 minutes, auto-assign on trigger)
- Infrastructure: Docker Compose (dev + prod), GitHub Actions CI/CD

**Three application roles** (distinct from the document roles above):
- `student` — registers for shifts, checks in/out, views payroll, receives notifications
- `employer` — creates jobs and shifts, approves registrations, manages attendance, runs payroll
- `admin` — manages users across the platform and views statistics; does not interact with shift/payroll data

---

## 2. The Four Contracts

These are the 4 boundaries where different system layers must agree. Any change crossing a boundary requires updating both sides.

### Contract A: DB Schema ↔ API Response Shape
**Owner files**: `docs/01-system-design.md` (left side), `docs/03-backend.md` (right side)

Every column in the DB schema that a service query returns creates an obligation on the API response body. Frontend TypeScript types are derived from these response bodies.

**Critical enum bindings** — these enums appear throughout the entire stack:
- `users.role` (`student`, `employer`, `admin`): JWT payload → `req.user.role` → roleGuard → `useAuthStore` → `RoleRoute` props → Badge rendering
- `shift_registrations.status` (`pending`, `approved`, `rejected`, `cancelled`): DB → API response → `ShiftEvent.tsx` color mapping → `Badge.tsx` variants → test assertions
- `attendance.status` (`on_time`, `late`, `absent`, `pending`): DB → attendance service → `Badge.tsx` → `AttendanceRow.tsx` → test assertions
- `payroll.status` (`draft`, `confirmed`, `paid`): DB → payroll service → employer payroll UI → E2E test assertions

**Rule**: When adding or renaming an enum value, update: `01-system-design.md` (schema + data flow), `03-backend.md` (Zod schema + service query), `04-frontend.md` (Badge.tsx color map + TypeScript type), `05-testing.md` (test cases that assert specific status values).

### Contract B: API Endpoint ↔ Frontend API Module
**Owner files**: `docs/03-backend.md` (left side), `docs/04-frontend.md` §8 (right side)

Every endpoint in `03-backend.md` has a direct function counterpart in a `frontend/src/api/*.ts` module. Request body shape and response body shape are the binding contract.

**Critical bindings**:
- `POST /api/auth/register` → response returns `token` and `user` — `useAuthStore.login()` destructures exactly those 2 fields
- `POST /api/shifts/:id/register` → returns `{ registration: { id, status, ... } }` — `useShiftStore.registerShift()` uses it to update `myRegistrations`
- `POST /api/attendance/checkin` → returns `{ attendance: { status, late_minutes, check_in_time } }` — `CheckInButton.tsx` displays directly
- Error shape is always `{ error: "ERROR_CODE", message: "..." }` — `apiClient.ts` interceptor handles this shape for user-facing toasts

**Rule**: When changing a request body field (rename, add required field, change type), update both `03-backend.md` (Zod schema + endpoint spec) AND `04-frontend.md` (API function signature + form calling it). Never change only one side.

### Contract C: Socket.io Event ↔ Frontend Socket Hook
**Owner files**: `docs/01-system-design.md` §5 (event map authority), `docs/03-backend.md` §4 (emission site), `docs/04-frontend.md` §6 (consumption site)

This is a three-file contract. The event map in `01-system-design.md` is the single source of truth for event names and payload structures.

**Current event chain**:
| Event | Emitted by (backend) | Consumed by (frontend hook) | Store update |
|-------|---------------------|-----------------------------|--------------|
| `notification:new` | Any service calling `notifyUser()` | `useNotificationSocket.ts` | `addNotification()` in `useNotificationStore` |
| `attendance:update` | `attendance.service.ts` on checkin | `useAttendanceSocket.ts` | `updateAttendanceRecord()` in attendance store |
| `shift:registered` | `shift.service.ts` when student registers | Employer's `useSocket.ts` in shift room | Refresh registration list |
| `shift:approved` | `shift.service.ts` when employer approves | `useNotificationSocket.ts` | Trigger notification + badge update |
| `payroll:updated` | `autoCalcPayroll.ts` background job | `useNotificationSocket.ts` | Trigger notification |
| `shift:reminder` | `sendReminders.ts` background job | `useNotificationSocket.ts` | Trigger notification + toast |

**Rule**: Adding a new socket event requires updating all 3 files in order: (1) add to event map in `01-system-design.md` §5, (2) add emission in `03-backend.md` §4, (3) add `socket.on()` in `04-frontend.md` §6.

### Contract D: Business Rule ↔ Test Assertion
**Owner files**: `docs/01-system-design.md` §6-7 (rule source), `docs/03-backend.md` §6 (implementation), `docs/05-testing.md` §2-3 (assertion)

Business rules have numeric constants (delta values, percentages, time thresholds) encoded in three places simultaneously.

**Critical constant bindings**:
| Constant | Defined in | Implemented in | Tested in |
|----------|-----------|----------------|-----------|
| Payroll deduction model (see §7) | `01-system-design.md` §7 | `utils/payrollCalc.ts` | `payrollCalc.test.ts` |
| On-time threshold = 5 minutes | `03-backend.md` §6 | `attendance.service.ts` | `attendance.test.ts` |
| Reputation: on-time check-in = +2.0 | `01-system-design.md` §6 | `reputationCalc.ts` | `reputationCalc.test.ts` |
| Reputation: absent = −10.0 | `01-system-design.md` §6 | `reputationCalc.ts` | `reputationCalc.test.ts` |
| Reputation: cancel <24h = −7.0 | `01-system-design.md` §6 | `shift.service.ts` | `shifts.test.ts` |
| Auto-assign blocked below score 50 | `01-system-design.md` §6 | `autoAssignShift.ts` | integration test |

**Rule**: Changing any constant in `01-system-design.md` requires simultaneously updating the implementation in the corresponding utility file AND the test assertions in `05-testing.md`. All three locations must always stay in sync. A PR that changes only one without the other two is an incomplete PR.

---

## 3. Authentication & Authorization Flow (Cross-Layer)

This is the most pervasive concern in the system. A bug here breaks all 3 roles.

```
[User submits login form]
  → frontend: LoginPage → api/auth.ts login() → POST /api/auth/login
  → backend: auth.controller → auth.service → bcrypt.compare → jwt.sign({ id, email, role })
  → response: { token, user: { id, email, role, full_name } }
  → frontend: useAuthStore.login() saves token to localStorage key "token" AND in store
  → frontend: axios interceptor in apiClient.ts reads localStorage "token" for all subsequent requests

[Protected route access]
  → frontend: ProtectedRoute checks useAuthStore().token → redirect /login if null
  → frontend: RoleRoute checks useAuthStore().user.role → redirect /unauthorized if wrong role
  → backend: authMiddleware reads Authorization: Bearer <token> → jwt.verify → attach req.user
  → backend: roleGuard checks req.user.role → 403 if not in allowed list

[Token expiry]
  → backend: jwt.verify throws TokenExpiredError → authMiddleware sends 401
  → frontend: apiClient.ts response interceptor catches 401 → clear auth store → redirect /login
```

Files that must stay consistent for this flow to work:
- `docs/03-backend.md` §3 — authMiddleware and roleGuard specification
- `docs/04-frontend.md` §4 — useAuthStore interface and localStorage key names
- `docs/04-frontend.md` §8 — apiClient.ts 401 interceptor behavior
- `docs/04-frontend.md` §9 — ProtectedRoute and RoleRoute implementation

---

## 4. Feature Impact Matrix

Use this table when starting a new feature or making any change to quickly identify which files need updating.

| Feature / Change | 01-system-design | 02-project-init | 03-backend | 04-frontend | 05-testing | 06-deployment |
|-----------------|:----------------:|:---------------:|:----------:|:-----------:|:----------:|:-------------:|
| New DB table | **REQUIRED** | **REQUIRED** (migration) | **REQUIRED** | maybe | **REQUIRED** (seed) | check (ENV) |
| New DB column | **REQUIRED** | maybe (migration) | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| Rename DB column | **REQUIRED** | migration | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| New REST endpoint | maybe | — | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| Change request body | — | — | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| Change response body | maybe | — | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| New Socket.io event | **REQUIRED** | — | **REQUIRED** | **REQUIRED** | maybe | — |
| New business rule constant | **REQUIRED** | — | **REQUIRED** | maybe | **REQUIRED** | — |
| New enum value | **REQUIRED** | — | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| New npm dependency | — | **REQUIRED** | or frontend | or backend | — | check (Docker) |
| New env variable | — | **REQUIRED** | **REQUIRED** | or frontend | — | **REQUIRED** |
| New background job | maybe | **REQUIRED** (.env) | **REQUIRED** | maybe | maybe | maybe (cron) |
| New migration file | **REQUIRED** | **REQUIRED** | — | — | **REQUIRED** (seed) | **REQUIRED** |
| New page/route | — | — | check (endpoint) | **REQUIRED** | **REQUIRED** (E2E) | — |
| New component | — | — | — | **REQUIRED** | **REQUIRED** (unit) | — |
| New Zustand store | — | — | check | **REQUIRED** | **REQUIRED** | — |
| Change auth/role logic | — | — | **REQUIRED** | **REQUIRED** | **REQUIRED** | — |
| Change Docker/CI | — | check | — | — | check | **REQUIRED** |

---

## 5. Critical Business Rules (Cross-Layer Summary)

These rules are implemented in backend utilities but derived from system design and verified by tests. Developers touching them must coordinate across all 3 files.

### Shift Conflict Detection
- **Source**: `docs/01-system-design.md` §3.1 and `docs/03-backend.md` §6
- **Implementation**: `backend/src/utils/conflictCheck.ts`
- **Test**: `backend/tests/conflictCheck.test.ts` and `shifts.test.ts` (integration, 409 case)
- **Frontend impact**: `docs/04-frontend.md` §5 (conflict highlight in calendar) and §7.1 (UX flow step 6)
- **Rule**: Overlapping time windows with status `pending` OR `approved` constitute a conflict. `rejected` and `cancelled` do not count.

### Payroll Calculation
- **Source**: `docs/01-system-design.md` §7 (formula)
- **Implementation**: `backend/src/utils/payrollCalc.ts`
- **Test**: `backend/tests/payrollCalc.test.ts`
- **Trigger**: `autoCalcPayroll.ts` background job (daily) OR `POST /api/payroll/calculate` (manual)
- **Frontend impact**: `docs/04-frontend.md` §3 (`PayrollSummaryCard.tsx` displays base/deduction breakdown)

### Reputation Score
- **Source**: `docs/01-system-design.md` §6
- **Implementation**: `backend/src/utils/reputationCalc.ts`
- **Test**: `backend/tests/reputationCalc.test.ts`
- **Bounds**: Score clamped to [0, 200]. Score < 50 blocks auto-assign eligibility.
- **Frontend impact**: ProfilePage displays `reputation_score` from `student_profiles.reputation_score`

### Late Detection
- **Source**: `docs/03-backend.md` §6 (5-minute threshold)
- **Implementation**: `attendance.service.ts` at check-in time
- **Test**: `backend/tests/attendance.test.ts` (check-in 10 minutes late → status=late, late_minutes=10)
- **Note**: The 5-minute threshold is defined in `03-backend.md`, not `01-system-design.md`. This is the only business constant that lives solely in the backend spec.

---

## 6. Realtime Architecture Summary

Socket.io is used for server-to-client push notifications to specific users and shift rooms. There is no client-to-server data mutation via sockets (all mutations go through REST).

**Room strategy**:
- `user_<userId>` — each user joins this room on connect; used for personal notifications
- `shift_<shiftId>` — employers join this room to view real-time attendance for a specific shift

**Connection lifecycle** (see `docs/04-frontend.md` §6, `docs/03-backend.md` §4):
1. Frontend connects to Socket.io server with JWT in auth header
2. On connect: client emits `join:room` with their personal room
3. Employers additionally emit `join:shift` when viewing the shift detail page
4. Server emits to rooms; clients update Zustand stores via socket hooks
5. On component unmount: socket disconnects (cleanup in `useSocket.ts`)

---

## 7. Database Migration Safety Rules

These 5 rules cut across `docs/01-system-design.md`, `docs/02-project-init.md`, and `docs/06-deployment.md`.

1. **Never** edit a migration file that has been committed. Add a new migration instead.
2. Migration files are numbered by timestamp; the order in `02-project-init.md` §9 is the canonical sequence and reflects the foreign key dependency order.
3. On production: **back up the database BEFORE** running any migration.
4. The CI pipeline runs migrations on a clean test database before running tests. A migration failure in CI will also fail in production.
5. Schema changes in `01-system-design.md` are not live until the corresponding migration file exists AND has been run.

---

## 8. How to Add a New Feature (Checklist)

Use this order to avoid inconsistencies when implementing.

**Step 1 — Design** (start at `docs/01-system-design.md`)
- [ ] Does this feature need a new table or column? Update the ERD and data flow sections.
- [ ] Does this feature introduce new Socket.io events? Add them to the event map (§5).
- [ ] Does this feature introduce new business rules with numeric constants? Add them to §6 or §7.

**Step 2 — Infrastructure** (`docs/02-project-init.md`)
- [ ] Does this feature need new env vars? Add them to the `.env.example` table.
- [ ] Does this feature need new migration files? Add them to the migration list with the correct timestamp order.

**Step 3 — Backend** (`docs/03-backend.md`)
- [ ] Document each new endpoint: method, path, role guard, request, response, errors.
- [ ] Document any new socket events emitted: event name, payload, target room.
- [ ] Document any new or modified background job logic.
- [ ] Document any new business rule implementations.

**Step 4 — Frontend** (`docs/04-frontend.md`)
- [ ] Add new routes to the route map.
- [ ] Add new store state/actions to the relevant Zustand store interface.
- [ ] Add API module functions for each new endpoint.
- [ ] Add socket hook logic for any new events.
- [ ] Document the UX flow for user-facing features.

**Step 5 — Testing** (`docs/05-testing.md`)
- [ ] Add unit test cases for new utility functions.
- [ ] Add integration test cases for each new endpoint (happy path + primary error cases).
- [ ] Add frontend unit test cases for new components.
- [ ] Update E2E tests if a happy-path flow has changed.
- [ ] Update seed data if new tables or test scenarios are required.

**Step 6 — Deployment** (`docs/06-deployment.md`)
- [ ] Add new env vars to the production ENV checklist.
- [ ] Update the release checklist if there are new migrations or infrastructure steps.

---

## 9. Decisions Log

Records confirmed design decisions. Do not change these without a clear reason.

| # | Date | Issue | Decision | Rationale |
|---|------|-------|----------|-----------|
| 1 | 2026-03-27 | User creation flow | Employer self-registers; Student is created by employer via `POST /api/employers/employees` | Internal system — employer manages all their own staff |
| 2 | 2026-03-27 | Auto-assign flow | Weekly scheduling job (Monday 00:00), processes all pending registrations for the week | Students proactively register for desired shifts; system automatically resolves conflicts and prioritizes |
| 3 | 2026-03-27 | Rating/Review | Implement `ratings` table + `POST /api/ratings` endpoint + feed into reputation | Needed for reputation score to have real-world meaning |
| 4 | 2026-03-27 | Shift status transitions | Fully automatic via background jobs | Reduces manual work for employer |
| 5 | 2026-03-27 | Payroll total_pay negative | Clamp to 0 — `GREATEST(0, base_pay + bonus - penalty)` | Negative pay has no business meaning |
| 6 | 2026-03-27 | Employer cancels shift | Student is NOT penalized in reputation | Student is not at fault when employer cancels |
| 7 | 2026-03-27 | Conflict check scope | Only `pending` + `approved` count as conflict; `rejected`/`cancelled` do not | Students who were rejected/cancelled must be able to register for another shift at the same time |
| 8 | 2026-03-27 | Cancel penalty | Cancel ≥24h = 0 points; Cancel <24h = -7.0 reputation | Early cancellation causes no harm to employer; late cancellation makes it hard to find a replacement |
| 9 | 2026-03-27 | Registration deadline | **Sunday 12:00 noon** — scheduler at Monday 00:00 only processes registrations submitted before the deadline | Gives the employer 12 hours on Sunday afternoon to manually fill understaffed shifts |
| 10 | 2026-03-27 | Conflict check | **NO conflict check at registration time** — student may register for overlapping shifts; scheduler resolves it | Simpler UX; students are not blocked when wanting to try multiple shifts |
| 11 | 2026-03-27 | Understaffed shifts | Alert employer at 11:00 AM Sunday if a shift does not have enough registrants | 1 hour before deadline so employer can manually assign |
| 12 | 2026-03-27 | Temp password | Only returned in the API response — employer copies it for the employee | No email service needed for this project scope |
| 13 | 2026-03-27 | Timezone | UTC+7 throughout the system — no conversion | System is used only in Vietnam |
| 14 | 2026-03-27 | Report module | Charts using recharts | Employer needs trend visualization |
| 15 | 2026-03-27 | Multi-employer | Student belongs to **1 employer only** — `employer_id` in `student_profiles` | Internal system, not a marketplace; employer manages their own staff |
| 16 | 2026-03-27 | Payroll accumulation | Real-time: shift completes → create `payroll_item` immediately → accumulate → `payroll` summary at end of period | Student sees pay update immediately after each shift; no need to wait for daily batch |
| 17 | 2026-03-27 | Admin scope | Full: stats + lock/unlock + **create employer accounts** + **view/intervene in any employer's payroll and shifts** | Admin needs full authority to support and monitor the entire system |
| 18 | 2026-03-27 | Payroll formula | Deduction model: `total_pay = scheduled_pay - late_deduction - early_deduction`; `attendance` tracks both `late_minutes` and `early_minutes`; `payroll_items` stores breakdown | Linear deduction by missing time; UI can display each deduction; reputation completely separate |
| 19 | 2026-03-27 | Payroll period | Calendar month: `period_start = 1st`, `period_end = last day`; auto-create payroll record for the month when the first payroll_item is created | Simple, intuitive; matches real-world payment cycles |
| 20 | 2026-03-27 | Cancel approved registration | `current_workers -= 1` AND slot reopens for new registrations | When student cancels, slot must be fillable; employer does not need to do anything extra |
| 21 | 2026-03-27 | No-checkout handling | Status = `incomplete`, `hours_worked = 0`, no pay; employer may force-checkout remotely up to **3 times / student / month** | Protects student from losing pay due to forgetting checkout; limit prevents abuse |
| 22 | 2026-03-27 | Admin seeding | Admin account seeded via `npm run seed`; employer self-registers on the web | Project scope does not require a complex admin creation flow |
