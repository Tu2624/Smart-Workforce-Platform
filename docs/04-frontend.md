# 04 — Frontend Specification
## Smart Workforce Platform

## Role

**Persona**: Frontend Engineer & UI/UX Architect
**Primary Focus**: Page routing, component composition, Zustand state design, API integration layer, socket event handling, and user interaction flows.
**Perspective**: The frontend is a consumer of every contract defined by the backend and database. When working in this file, always ask: "Is there a backend endpoint that supports this UI action? Does the TypeScript type I'm writing match the API response shape exactly? Does the socket event I'm listening for exist in the backend emission logic?" Never design a UI flow that requires an API endpoint not yet documented in `docs/03-backend.md`.

### Responsibilities
- Define and maintain the complete route map (path → component, auth requirements, role requirements)
- Specify all Zustand store interfaces: state shape, async actions, persistence behavior
- Define the API layer: which function in which `api/*.ts` module maps to which backend endpoint
- Specify socket hook behavior: which hook subscribes to which event, updates which store
- Define UX flows: step-by-step user interaction sequences for main features
- Specify component props and visual behavior for feature-specific components

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Add a new page/route | `docs/03-backend.md` §2 | Every page that fetches data needs a corresponding API endpoint |
| Add a new Zustand store field | `docs/01-system-design.md` | Field type must match the DB column type exposed through the API |
| Add a `socket.on()` listener | `docs/03-backend.md` §4 | Event name and payload shape must exactly match the backend emission |
| Add a `socket.on()` listener | `docs/01-system-design.md` §5 | Socket.io event map is the canonical list of valid events |
| Add role-specific route protection | `docs/03-backend.md` §3 | Role names in RoleRoute must match roleGuard at the API |
| Add a form with Zod validation | `docs/03-backend.md` §2 | Zod schema fields must match the request body the backend endpoint expects |
| Add a new API function | `docs/03-backend.md` §2 | Function must map to a documented endpoint; do not create routes unilaterally |
| Add or use a TypeScript interface | `docs/08-api-and-interfaces.md` §2.1 | All core interfaces are defined there first; do not redefine them locally |
| Add a component that displays a status badge | `docs/01-system-design.md` | Enum values (shift status, attendance status) are canonically defined there |

### Files to Consult First
- `docs/03-backend.md` — before writing an API call or socket listener, verify the contract exists
- `docs/01-system-design.md` — for enum values, payload shapes, and event names
- `docs/05-testing.md` — to know which component behaviors need Vitest/RTL test coverage
- `docs/08-api-and-interfaces.md` — Section 2.1 for TypeScript interface definitions; Section 2.2 for API response shapes; write `frontend/src/types/index.ts` from here

---

## 1. Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Routing |
| Zustand | State management |
| Axios | HTTP client |
| Socket.io-client | Realtime |
| react-big-calendar | Calendar component |
| react-hook-form + Zod | Form validation |
| date-fns | Date utilities |

---

## 2. Page / Route Map

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Login (all roles) |
| `/register` | `RegisterPage` | Registration (employer only — students have no registration page) |

### Student Routes (requires auth + role=student)
| Path | Component | Description |
|------|-----------|-------------|
| `/student` | `StudentDashboard` | Overview: upcoming shifts, monthly pay, notifications |
| `/student/schedule` | `StudentSchedule` | Work schedule in calendar view |
| `/student/shifts` | `StudentShiftList` | List of available shifts to register for |
| `/student/shifts/:id` | `ShiftDetail` | Shift details, registration button |
| `/student/attendance` | `StudentAttendance` | Attendance history, check-in/out button |
| `/student/payroll` | `StudentPayroll` | Payroll: by shift / week / month |
| `/student/payroll/:id` | `PayrollDetail` | Single payroll period details |
| `/student/notifications` | `NotificationPage` | All notifications |
| `/student/profile` | `ProfilePage` | Personal info, reputation score |

### Employer Routes (requires auth + role=employer)
| Path | Component | Description |
|------|-----------|-------------|
| `/employer` | `EmployerDashboard` | Overview: shifts today, costs, attendance |
| `/employer/employees` | `EmployeeList` | Employee (student) list |
| `/employer/employees/new` | `EmployeeForm` | Create new employee account |
| `/employer/jobs` | `JobList` | Job list |
| `/employer/jobs/new` | `JobForm` | Create new job |
| `/employer/jobs/:id` | `JobDetail` | Job details + shift list |
| `/employer/jobs/:id/edit` | `JobForm` | Edit job |
| `/employer/shifts` | `ShiftList` | All shifts, filter by job/date |
| `/employer/shifts/new` | `ShiftForm` | Create shift |
| `/employer/shifts/:id` | `ShiftDetail` | Shift details: applicant list, Approve/Reject/Assign buttons, attendance, post-shift rating button |
| `/employer/attendance` | `AttendanceOverview` | View attendance in real-time |
| `/employer/payroll` | `PayrollList` | Payroll by period |
| `/employer/payroll/:id` | `PayrollDetail` | Payroll period details, export file |
| `/employer/reports` | `ReportPage` | Statistics, charts |
| `/employer/notifications` | `NotificationPage` | Notifications |
| `/employer/profile` | `ProfilePage` | Company information |

### Admin Routes (requires auth + role=admin)
| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | `AdminDashboard` | System statistics |
| `/admin/users` | `UserList` | Manage all users |
| `/admin/jobs` | `AdminJobList` | View all jobs |

---

## 3. Component Breakdown

### Shared Components (`src/components/ui/`)
```
Button.tsx         — variants: primary, secondary, danger, ghost
Input.tsx          — with label, error message, icon support
Modal.tsx          — overlay modal with backdrop
Badge.tsx          — status badge (on_time/late/absent, open/full, etc.)
Avatar.tsx         — user avatar with fallback initials
Spinner.tsx        — loading indicator
Table.tsx          — sortable, paginated table
Pagination.tsx     — page navigation
EmptyState.tsx     — when no data is available
ConfirmDialog.tsx  — confirmation before destructive actions
Toast.tsx          — success/error/info notifications
```

### Layout Components (`src/components/`)
```
Navbar/
  Navbar.tsx         — top nav: user info, notification bell, logout
  NotificationBell.tsx — unread count badge, dropdown of 5 most recent notifications

Sidebar/
  Sidebar.tsx        — role-based navigation

Calendar/
  ShiftCalendar.tsx  — react-big-calendar wrapper, custom event renderer
  ShiftEvent.tsx     — renders a single shift in the calendar: title, time, status badge

Notification/
  NotificationItem.tsx — single notification row: icon by type, title, timestamp
  NotificationList.tsx — scrollable list
```

### Feature Components
```
shifts/
  ShiftCard.tsx          — shift card: job title, time, remaining slots, register button
  ShiftRegistrationList.tsx — applicant list + approve/reject buttons (employer)

attendance/
  CheckInButton.tsx      — detects current shift, large check-in/out button
  AttendanceRow.tsx      — single history row: shift, time, status badge

payroll/
  PayrollSummaryCard.tsx — period payroll summary: hours, base, bonus, penalty, total
  PayrollItemRow.tsx     — per-shift breakdown within a payroll period

reports/
  StatsCard.tsx          — metrics: total shifts, total hours, cost
  BarChart.tsx           — bar chart (using Recharts or Chart.js)
```

---

## 4. State Management (Zustand)

### `useAuthStore`
```typescript
interface AuthStore {
  user: User | null
  token: string | null
  login: (credentials) => Promise<void>
  logout: () => void
  updateProfile: (data) => Promise<void>
}
```

### `useNotificationStore`
```typescript
interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Notification) => void  // called from socket event
}
```

### `useShiftStore`
```typescript
interface ShiftStore {
  shifts: Shift[]
  myRegistrations: ShiftRegistration[]
  fetchShifts: (filters?) => Promise<void>
  registerShift: (shiftId: string) => Promise<void>
  cancelRegistration: (shiftId: string) => Promise<void>
}
```

### `useAttendanceStore`
```typescript
interface AttendanceStore {
  todayShift: Shift | null
  isCheckedIn: boolean
  checkIn: (shiftId: string) => Promise<void>
  checkOut: (shiftId: string) => Promise<void>
  history: Attendance[]
}
```

---

## 5. Calendar View Specification

Uses `react-big-calendar` with `date-fns` localizer.

### Display modes
- **Month view**: monthly overview, small dot on days with shifts
- **Week view**: full time blocks for each shift (default view)
- **Day view**: single day details

### Event Rendering (ShiftEvent)
```
┌─────────────────────────────┐
│ [badge: approved]           │
│ Morning Shift - Cafe Service│
│ 08:00 – 12:00               │
└─────────────────────────────┘
```
Color by status:
- `pending` → yellow
- `approved` → green
- `rejected` → red
- `open` (shift not yet registered) → gray

### Conflict Highlight
- When a student hovers over a shift to register, the system calls the API to check for conflicts
- If conflict: event block turns red, tooltip "Conflicts with [shift name]"

---

## 6. Realtime Integration (Socket.io Hooks)

### `useSocket.ts`
```typescript
// Initialize socket, join user room, cleanup on unmount
function useSocket() {
  const { user, token } = useAuthStore()
  useEffect(() => {
    const socket = io(VITE_SOCKET_URL, { auth: { token } })
    socket.emit('join:room', { room: `user_${user.id}` })
    return () => { socket.disconnect() }
  }, [token])
}
```

### `useNotificationSocket.ts`
```typescript
// Listen for notification:new event
// Call addNotification(data) into store
// Show Toast
socket.on('notification:new', (data) => {
  addNotification(data)
  toast.info(data.title)
})
```

### `useAttendanceSocket.ts` (Employer)
```typescript
// Listen for attendance:update event
// Update attendance list in real-time on UI
socket.on('attendance:update', (data) => {
  updateAttendanceRecord(data)
})
```

---

## 7. UI/UX Flows

### 7.1 Student — Register for a Shift
```
1. Go to /student/schedule or /student/shifts
2. View list of open shifts, filter by date/job
3. Click a shift → view ShiftDetail
4. Click "Register" → API calls POST /shifts/:id/register
5. If OK → badge changes to "Pending", success toast
6. If conflict → error toast + highlight conflicting shift
7. Receive notification when approved → badge changes to "Approved"
```

### 7.2 Student — Check In
```
1. Go to /student/attendance
2. Current shift is displayed (if currently within shift hours)
3. Large "CHECK IN" button
4. Click → POST /attendance/checkin
5. Show status: "On time ✓" or "Late X minutes"
6. Button changes to "CHECK OUT"
```

### 7.3 Student — View Payroll
```
1. Go to /student/payroll
2. Tabs: By Shift | By Week | By Month
3. Each tab shows: total hours, total pay, bonus, penalty
4. Click on a payroll period → PayrollDetail: per-shift breakdown
```

### 7.4 Employer — Create Shift + Approve Applicants
```
1. Go to /employer/shifts/new → fill ShiftForm
2. Select job, time, capacity, auto-assign on/off
3. Submit → shift created, shown in /employer/shifts
4. Go to shift detail → "Applicants" tab
5. List of pending registrations
6. Click "Approve" → PATCH /shifts/:id/registrations/:reg_id
7. Student receives notification immediately via Socket.io
```

### 7.5 Employer — View Real-time Attendance
```
1. Go to /employer/attendance
2. Select the ongoing shift from dropdown
3. Employee list updates in real-time as check-ins occur
4. Green: on time | Yellow: late | Red: absent
5. Employer can add manual notes
```

---

## 8. API Layer (`src/api/`)

### `apiClient.ts`
```typescript
// Axios instance with baseURL, interceptor to auto-attach token
// Response interceptor: on 401 → clear auth store → redirect /login
```

### Modules
```
api/
  auth.ts         → register, login, getMe, updateProfile
  jobs.ts         → CRUD jobs
  shifts.ts       → CRUD shifts, register, approve/reject
  attendance.ts   → checkin, checkout, getHistory
  payroll.ts      → getPayroll, getDetail, exportFile
  notifications.ts→ getAll, markRead, markAllRead
  reports.ts      → getOverview, getShiftStats, getPerformance
  admin.ts        → getUsers, toggleStatus, getStats
```

---

## 9. Route Protection

```typescript
// ProtectedRoute.tsx — redirect to /login if not authenticated
// RoleRoute.tsx — redirect to /unauthorized if wrong role

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<RoleRoute role="student" />}>
      <Route path="/student/*" element={<StudentLayout />} />
    </Route>
    <Route element={<RoleRoute role="employer" />}>
      <Route path="/employer/*" element={<EmployerLayout />} />
    </Route>
    <Route element={<RoleRoute role="admin" />}>
      <Route path="/admin/*" element={<AdminLayout />} />
    </Route>
  </Route>
</Routes>
```
