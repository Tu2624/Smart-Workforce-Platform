# 05 — Testing Specification
## Smart Workforce Platform

## Role

**Persona**: QA Engineer & Test Architect
**Primary Focus**: Testing strategy, test case specification, seed data definitions, and coverage targets across 4 testing layers.
**Perspective**: Tests are the verification layer for every contract defined in the other docs files. When working in this file, trace each test case back to its source: a business rule in `01-system-design.md`, an API contract in `03-backend.md`, a component behavior in `04-frontend.md`, or a user flow combining all three. A test that cannot be traced to a documented spec is either redundant or signals a gap in the spec.

### Responsibilities
- Define the four-layer test strategy and tooling selection
- Specify unit test cases for all backend utility functions (payrollCalc, conflictCheck, reputationCalc)
- Specify integration test cases for each API endpoint (happy path + primary error cases)
- Specify frontend unit test cases for components and Zustand stores
- Define E2E test scenarios (happy paths only, full actor flows)
- Maintain seed data definitions and fixed test account credentials
- Define and enforce coverage targets by layer

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Write unit test assertions with specific numbers | `docs/01-system-design.md` §6-7 | Reputation delta values and payroll formula are canonically defined there |
| Write integration tests for an endpoint | `docs/03-backend.md` §2 | Request shape, expected response, and error codes are defined there |
| Write frontend component unit tests | `docs/04-frontend.md` §3 | Component props, rendered states, and callback expectations are defined there |
| Write E2E test steps | `docs/04-frontend.md` §7 | UX flows define the exact step sequence; E2E tests must match |
| Add seed data for a new table | `docs/01-system-design.md` §4 | Table schema and valid enum values are defined there |
| Add seed data for a new table | `docs/02-project-init.md` §9 | Migration file order determines which tables exist when seed runs |
| Increase coverage targets | `docs/03-backend.md` | New endpoints without integration tests lower actual coverage below target |

### Files to Consult First
- `docs/01-system-design.md` — for exact constant values to assert in unit tests
- `docs/03-backend.md` — for the API contract each integration test is verifying
- `docs/04-frontend.md` — for the component and UX flow each frontend test is covering

---

## 1. Testing Strategy

| Layer | Tool | Goal |
|-------|------|------|
| Unit (Backend) | Jest | Utility functions: payroll calc, conflict check, reputation |
| Integration (Backend) | Jest + Supertest | API endpoints against a real test DB |
| Unit (Frontend) | Vitest + RTL | Components, hooks, Zustand stores |
| E2E | Playwright | Happy path flows for each actor |

### Principles
- Each backend module needs at least integration tests for the happy path + main error cases
- Utility functions (calc, conflict) must have thorough unit tests as they are critical business logic
- E2E covers happy paths only, not edge cases

---

## 2. Backend — Unit Tests (Jest)

### `payrollCalc.test.ts`
```typescript
describe('calculatePay', () => {
  it('on time and full shift → total_pay = shift_hours × hourly_rate (no deductions)')
  it('late 30 minutes → correct deduction: scheduled_pay - 0.5h × rate')
  it('left 15 minutes early → correct deduction: scheduled_pay - 0.25h × rate')
  it('both late and early → deduct both: scheduled_pay - (late + early)/60 × rate')
  it('does not allow hours_worked > shift_duration')
})
```

### ~~`conflictCheck.test.ts`~~ — REMOVED
> Conflict check no longer occurs at the registration layer. See `weeklyScheduler.test.ts` for conflict resolution logic.

### `weeklyScheduler.test.ts`
```typescript
describe('weeklyScheduler', () => {
  it('approves student with highest reputation when shift exceeds max_workers')
  it('rejects student if max_workers is exceeded even if reputation is sufficient')
  it('tiebreaker: same reputation → prefer earlier registration (registered_at ASC)')
  it('does not approve student with a shift conflict with another already-approved shift in the same run')
  it('ignores registrations created after Sunday 12:00 noon deadline')
  it('ignores shifts already at current_workers == max_workers (already filled by manual approval)')
  it('sends notification to all students (approved and rejected)')
  it('updates shift.current_workers after running')
})
```

### Integration test: `POST /shifts/:id/register`
```typescript
describe('registerShift', () => {
  it('student registers for 2 overlapping shifts → both have status=pending (not blocked)')
  it('student registers for a shift they already registered → 409 ALREADY_REGISTERED')
  it('student registers after Sunday 12:00 noon deadline → 400 REGISTRATION_CLOSED')
})
```

### `cancelShift.test.ts`
```typescript
describe('cancelShiftRegistration', () => {
  it('cancel ≥24h before shift → status=cancelled, reputation unchanged')
  it('cancel <24h before shift → status=cancelled, reputation -7.0')
  it('cancel approved registration → current_workers decreases by 1, slot reopens')
  it('employer cancels shift → all students cancelled, no reputation penalty')
})
```

### `reputationCalc.test.ts`
```typescript
describe('calculateReputationDelta', () => {
  it('adds +2 for on-time check-in')
  it('adds +3 for completing full shift')
  it('deducts -2 for late 1–15 minutes')
  it('deducts -5 for late > 15 minutes')
  it('deducts -10 for no-show')
  it('deducts -7 for cancellation within 24h')
  it('does not let score drop below 0')
  it('does not let score exceed 200')
})
```

---

## 3. Backend — Integration Tests (Supertest)

Each test file uses a dedicated test DB, seeded before running and truncated after.

### `auth.test.ts`
```typescript
describe('POST /api/auth/register', () => {
  it('201 — student registration successful, returns token')
  it('201 — employer registration successful')
  it('400 — missing required fields')
  it('409 — email already exists')
})

describe('POST /api/auth/login', () => {
  it('200 — login successful, returns token + user info')
  it('401 — wrong password')
  it('404 — email does not exist')
})

describe('GET /api/auth/me', () => {
  it('200 — returns user info + profile')
  it('401 — no token')
  it('401 — expired token')
})
```

### `shifts.test.ts`
```typescript
describe('POST /api/shifts/:id/register', () => {
  it('201 — shift registration successful')
  it('409 — conflict with an already-registered shift')
  it('409 — shift is full')
  it('403 — employer cannot register for a shift')
  it('404 — shift does not exist')
})

describe('PATCH /api/shifts/:id/registrations/:reg_id', () => {
  it('200 — approve registration, current_workers increases by 1')
  it('200 — reject registration')
  it('403 — student cannot approve')
  it('403 — another employer cannot approve a shift they do not own')
})
```

### `attendance.test.ts`
```typescript
describe('POST /api/attendance/checkin', () => {
  it('201 — on-time check-in, status=on_time')
  it('201 — check-in 10 minutes late, status=late, late_minutes=10')
  it('400 — not approved for this shift')
  it('409 — already checked in')
})

describe('POST /api/attendance/checkout', () => {
  it('200 — checkout successful, hours_worked calculated correctly')
  it('400 — not yet checked in')
})

describe('PATCH /api/attendance/:id/force-complete', () => {
  it('200 — employer force-checkout successful, hours_worked and status calculated correctly')
  it('403 — already force-checked out this student 3 times this month → FORCE_CHECKOUT_LIMIT_EXCEEDED')
  it('400 — shift has not ended → SHIFT_NOT_ENDED')
  it('409 — student already checked out → ALREADY_COMPLETED')
  it('403 — employer is not the owner of the shift → FORBIDDEN')
})
```

### `payroll.test.ts`
```typescript
describe('POST /api/payroll/calculate', () => {
  it('200 — correctly calculates total pay for multiple shifts in a period')
  it('200 — includes shifts with late/early departures, calculates actual hours correctly')
  it('403 — student cannot trigger payroll calculation')
})
```

---

## 4. Frontend — Unit Tests (Vitest + React Testing Library)

### `Badge.test.tsx`
```typescript
it('displays green for status on_time')
it('displays red for status absent')
it('displays yellow for status late')
```

### `CheckInButton.test.tsx`
```typescript
it('displays CHECK IN button when not yet checked in')
it('displays CHECK OUT button after check-in')
it('displays "No active shift" when not within shift hours')
it('calls checkIn() when button is clicked')
it('disabled while loading')
```

### `PayrollSummaryCard.test.tsx`
```typescript
it('displays correct total amount')
it('displays actual hours worked')
it('displays hourly rate')
it('correctly calculates total = total_hours × hourly_rate')
```

### `useAuthStore.test.ts`
```typescript
it('login saves token and user to store')
it('logout clears token and user')
it('token is persisted via localStorage')
```

### `ShiftCalendar.test.tsx`
```typescript
it('renders correct number of events from data')
it('displays yellow for pending shifts')
it('displays green for approved shifts')
it('clicking an event calls onEventClick callback')
```

---

## 5. E2E Tests (Playwright)

### Setup
```typescript
// playwright.config.ts
{
  baseURL: 'http://localhost:5173',
  use: { screenshot: 'only-on-failure' }
}

// fixtures/auth.ts — login helper used before each test
```

### `student-register-shift.spec.ts`
```
1. Login with student account
2. Go to /student/shifts
3. Click an open shift
4. Click "Register"
5. Check success toast
6. Check "Pending" badge appears
7. Check shift appears in calendar
```

### `student-checkin.spec.ts`
```
1. Login with student (has an approved shift currently in progress)
2. Go to /student/attendance
3. "CHECK IN" button is visible
4. Click Check In
5. Status shows "On time"
6. Button changes to "CHECK OUT"
7. Click Check Out
8. hours_worked appears in history
```

### `employer-approve-shift.spec.ts`
```
1. Login as employer
2. Create a new job
3. Create a new shift for that job
4. Login as student (new tab), register for the shift
5. Return to employer → go to shift detail
6. Student appears in pending list
7. Click "Approve"
8. Status changes to "Approved"
9. Verify student receives notification (student tab)
```

### `employer-payroll.spec.ts`
```
1. Login as employer
2. Go to /employer/payroll
3. Click "Calculate Payroll" for the current month
4. Payroll table shows correct employees and amounts
5. Click "Export PDF"
6. PDF file is downloaded
```

---

## 6. Test Data / Seed Strategy

### Fixed test accounts
```
admin@test.com / Admin123!           → role: admin
employer1@test.com / Employer123!    → role: employer, company: "ABC Cafe"
student1@test.com / Student123!      → role: student, reputation: 120
student2@test.com / Student123!      → role: student, reputation: 80
```

### Seed data includes
- 1 employer with 2 active jobs
- 5 shifts: 2 open, 1 full, 1 completed, 1 cancelled
- 3 shift registrations: 1 approved, 1 pending, 1 rejected
- 2 attendance records: 1 on_time, 1 late
- 1 payroll record with 2 payroll_items

### Run seed
```bash
cd backend
npm run seed           # insert all test data
npm run seed:reset     # truncate + re-seed
```

---

## 7. Coverage Targets

| Layer | Target |
|-------|--------|
| Utility functions (backend) | ≥ 90% |
| API endpoints (integration) | ≥ 70% |
| React components (unit) | ≥ 60% |
| E2E happy paths | 100% of the 4 flows above |
