# 04 — Frontend Specification
## Smart Workforce Platform

---

## 1. Tech Stack

| Công cụ | Mục đích |
|---------|----------|
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
| Path | Component | Mô tả |
|------|-----------|-------|
| `/login` | `LoginPage` | Đăng nhập |
| `/register` | `RegisterPage` | Đăng ký (chọn student/employer) |

### Student Routes (requires auth + role=student)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/student` | `StudentDashboard` | Tổng quan: ca sắp tới, lương tháng, thông báo |
| `/student/schedule` | `StudentSchedule` | Lịch làm việc dạng calendar |
| `/student/shifts` | `StudentShiftList` | Danh sách ca có thể đăng ký |
| `/student/shifts/:id` | `ShiftDetail` | Chi tiết ca, nút đăng ký |
| `/student/attendance` | `StudentAttendance` | Lịch sử chấm công, nút check-in/out |
| `/student/payroll` | `StudentPayroll` | Bảng lương: theo ca / tuần / tháng |
| `/student/payroll/:id` | `PayrollDetail` | Chi tiết 1 kỳ lương |
| `/student/notifications` | `NotificationPage` | Tất cả thông báo |
| `/student/profile` | `ProfilePage` | Thông tin cá nhân, điểm uy tín |

### Employer Routes (requires auth + role=employer)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/employer` | `EmployerDashboard` | Tổng quan: số ca hôm nay, chi phí, attendance |
| `/employer/jobs` | `JobList` | Danh sách job |
| `/employer/jobs/new` | `JobForm` | Tạo job mới |
| `/employer/jobs/:id` | `JobDetail` | Chi tiết job + danh sách shift |
| `/employer/jobs/:id/edit` | `JobForm` | Sửa job |
| `/employer/shifts` | `ShiftList` | Tất cả shift, filter theo job/ngày |
| `/employer/shifts/new` | `ShiftForm` | Tạo shift |
| `/employer/shifts/:id` | `ShiftDetail` | Chi tiết ca: danh sách ứng viên, chấm công |
| `/employer/attendance` | `AttendanceOverview` | Xem chấm công realtime |
| `/employer/payroll` | `PayrollList` | Bảng lương theo kỳ |
| `/employer/payroll/:id` | `PayrollDetail` | Chi tiết kỳ lương, xuất file |
| `/employer/reports` | `ReportPage` | Thống kê, biểu đồ |
| `/employer/notifications` | `NotificationPage` | Thông báo |
| `/employer/profile` | `ProfilePage` | Thông tin công ty |

### Admin Routes (requires auth + role=admin)
| Path | Component | Mô tả |
|------|-----------|-------|
| `/admin` | `AdminDashboard` | Thống kê hệ thống |
| `/admin/users` | `UserList` | Quản lý tất cả user |
| `/admin/jobs` | `AdminJobList` | Xem tất cả job |

---

## 3. Component Breakdown

### Shared Components (`src/components/ui/`)
```
Button.tsx         — variants: primary, secondary, danger, ghost
Input.tsx          — with label, error message, icon support
Modal.tsx          — overlay modal với backdrop
Badge.tsx          — status badge (on_time/late/absent, open/full, etc.)
Avatar.tsx         — user avatar với fallback initials
Spinner.tsx        — loading indicator
Table.tsx          — sortable, paginated table
Pagination.tsx     — page navigation
EmptyState.tsx     — khi không có dữ liệu
ConfirmDialog.tsx  — xác nhận trước action nguy hiểm
Toast.tsx          — success/error/info notifications
```

### Layout Components (`src/components/`)
```
Navbar/
  Navbar.tsx         — top nav: user info, notification bell, logout
  NotificationBell.tsx — badge số chưa đọc, dropdown 5 thông báo gần nhất

Sidebar/
  Sidebar.tsx        — navigation theo role

Calendar/
  ShiftCalendar.tsx  — react-big-calendar wrapper, custom event renderer
  ShiftEvent.tsx     — hiển thị 1 ca trong calendar: title, time, status badge

Notification/
  NotificationItem.tsx — 1 dòng thông báo: icon theo type, title, time
  NotificationList.tsx — danh sách cuộn
```

### Feature Components
```
shifts/
  ShiftCard.tsx          — card 1 shift: job title, time, slots còn lại, nút đăng ký
  ShiftRegistrationList.tsx — danh sách ứng viên + nút approve/reject (employer)

attendance/
  CheckInButton.tsx      — detect shift hiện tại, nút check-in/out lớn
  AttendanceRow.tsx      — 1 dòng lịch sử: ca, giờ, status badge

payroll/
  PayrollSummaryCard.tsx — tổng lương kỳ này: giờ, base, bonus, penalty, tổng
  PayrollItemRow.tsx     — chi tiết từng ca trong kỳ lương

reports/
  StatsCard.tsx          — số liệu: total shifts, total hours, cost
  BarChart.tsx           — biểu đồ cột (dùng Recharts hoặc Chart.js)
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
  addNotification: (n: Notification) => void  // gọi từ socket event
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

Dùng `react-big-calendar` với `date-fns` localizer.

### Chế độ hiển thị
- **Month view**: xem tổng quan tháng, chấm nhỏ mỗi ngày có ca
- **Week view**: hiển thị đầy đủ block thời gian mỗi ca (default view)
- **Day view**: chi tiết 1 ngày

### Event Rendering (ShiftEvent)
```
┌─────────────────────────────┐
│ [badge: approved]           │
│ Ca sáng - Phục vụ quán café │
│ 08:00 – 12:00               │
└─────────────────────────────┘
```
Màu theo status:
- `pending` → màu vàng
- `approved` → màu xanh lá
- `rejected` → màu đỏ
- `open` (shift chưa đăng ký) → màu xám

### Conflict Highlight
- Khi student hover vào 1 shift để đăng ký, hệ thống gọi API check conflict
- Nếu conflict: event block bị tô đỏ, tooltip "Trùng ca với [tên ca]"

---

## 6. Realtime Integration (Socket.io Hooks)

### `useSocket.ts`
```typescript
// Khởi tạo socket, join room user, cleanup khi unmount
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
// Lắng nghe event notification:new
// Gọi addNotification(data) vào store
// Hiển thị Toast
socket.on('notification:new', (data) => {
  addNotification(data)
  toast.info(data.title)
})
```

### `useAttendanceSocket.ts` (Employer)
```typescript
// Lắng nghe event attendance:update
// Cập nhật danh sách chấm công realtime trên UI
socket.on('attendance:update', (data) => {
  updateAttendanceRecord(data)
})
```

---

## 7. UI/UX Flows

### 7.1 Student — Đăng ký ca
```
1. Vào /student/schedule hoặc /student/shifts
2. Xem danh sách ca open, filter theo ngày/job
3. Click vào ca → xem ShiftDetail
4. Click "Đăng ký" → API gọi POST /shifts/:id/register
5. Nếu OK → badge chuyển "Chờ duyệt", toast thành công
6. Nếu conflict → toast lỗi + highlight ca bị trùng
7. Nhận notification khi được duyệt → badge chuyển "Đã duyệt"
```

### 7.2 Student — Check-in
```
1. Vào /student/attendance
2. Hiển thị ca hiện tại (nếu đang trong giờ làm)
3. Nút "CHECK IN" lớn
4. Click → POST /attendance/checkin
5. Hiển thị status: "Đúng giờ ✓" hoặc "Đi trễ X phút"
6. Nút chuyển thành "CHECK OUT"
```

### 7.3 Student — Xem lương
```
1. Vào /student/payroll
2. Tabs: Theo ca | Theo tuần | Theo tháng
3. Mỗi tab hiển thị: tổng giờ, tổng tiền, bonus, penalty
4. Click vào kỳ lương → PayrollDetail: bảng từng ca
```

### 7.4 Employer — Tạo ca + duyệt ứng viên
```
1. Vào /employer/shifts/new → điền ShiftForm
2. Chọn job, thời gian, số lượng, auto-assign on/off
3. Submit → shift tạo xong, hiển thị trong /employer/shifts
4. Vào shift detail → tab "Ứng viên"
5. Danh sách pending registrations
6. Click "Duyệt" → PATCH /shifts/:id/registrations/:reg_id
7. Student nhận notification ngay qua Socket.io
```

### 7.5 Employer — Xem chấm công realtime
```
1. Vào /employer/attendance
2. Chọn ca đang diễn ra từ dropdown
3. Danh sách nhân viên cập nhật realtime khi có check-in
4. Màu xanh: đúng giờ | Màu vàng: trễ | Màu đỏ: vắng
5. Employer có thể ghi chú thủ công
```

---

## 8. API Layer (`src/api/`)

### `apiClient.ts`
```typescript
// Axios instance với baseURL, interceptor tự động gắn token
// Interceptor response: nếu 401 → clear auth store → redirect /login
```

### Phân theo module
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
// ProtectedRoute.tsx — redirect về /login nếu chưa đăng nhập
// RoleRoute.tsx — redirect về /unauthorized nếu sai role

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
