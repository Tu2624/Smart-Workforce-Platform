# 03 — Backend Specification
## Smart Workforce Platform

---

## 1. Module Breakdown

| Module | Chức năng |
|--------|-----------|
| **Auth** | Đăng ký, đăng nhập, refresh token, profile |
| **Job** | CRUD job (employer), list jobs (student) |
| **Shift** | CRUD shift, đăng ký ca, duyệt/từ chối, auto-assign |
| **Attendance** | Check-in, check-out, xem lịch sử |
| **Payroll** | Tính lương, xem bảng lương, xuất file |
| **Notification** | Gửi, xem, đánh dấu đã đọc |
| **Report** | Thống kê ca, hiệu suất, chi phí nhân sự |
| **Admin** | Quản lý user, khoá tài khoản, xem stats toàn hệ thống |

---

## 2. REST API Endpoints

### Base URL: `/api`

> **Auth headers**: `Authorization: Bearer <token>`
> **Role guards**: `[S]` = Student, `[E]` = Employer, `[A]` = Admin

---

### 2.1 Auth Module — `/api/auth`

#### `POST /api/auth/register`
Đăng ký tài khoản mới.
```json
// Request
{
  "email": "student@example.com",
  "password": "Password123!",
  "full_name": "Nguyen Van A",
  "phone": "0901234567",
  "role": "student",                   // "student" | "employer"
  "student_id": "B22DCPT244",          // chỉ khi role=student
  "university": "PTIT",                // chỉ khi role=student
  "company_name": "ABC Corp"           // chỉ khi role=employer
}

// Response 201
{
  "message": "Đăng ký thành công",
  "user": { "id": "uuid", "email": "...", "role": "student" },
  "token": "eyJ..."
}
```

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
Trả về thông tin user hiện tại + profile tương ứng.

#### `PUT /api/auth/profile` `[S|E]`
Cập nhật profile (full_name, phone, avatar_url, skills, university...).

#### `PUT /api/auth/change-password` `[S|E|A]`
```json
{ "current_password": "...", "new_password": "..." }
```

---

### 2.2 Job Module — `/api/jobs`

#### `POST /api/jobs` `[E]`
Tạo job mới.
```json
// Request
{
  "title": "Nhân viên phục vụ",
  "description": "...",
  "hourly_rate": 30000,
  "required_skills": ["giao tiếp", "nhanh nhẹn"],
  "max_workers": 5
}

// Response 201
{ "job": { "id": "uuid", "title": "...", "status": "active", ... } }
```

#### `GET /api/jobs` `[S|E]`
List jobs. Query params: `?status=active&page=1&limit=10`

#### `GET /api/jobs/:id` `[S|E]`
Chi tiết 1 job.

#### `PUT /api/jobs/:id` `[E]`
Sửa job (chỉ employer sở hữu job đó).

#### `DELETE /api/jobs/:id` `[E]`
Xoá job (chỉ khi không có shift đang active).

#### `PATCH /api/jobs/:id/status` `[E]`
```json
{ "status": "paused" }  // "active" | "paused" | "closed"
```

---

### 2.3 Shift Module — `/api/shifts`

#### `POST /api/shifts` `[E]`
Tạo shift cho job.
```json
// Request
{
  "job_id": "uuid",
  "title": "Ca sáng thứ 2",
  "start_time": "2024-03-25T08:00:00+07:00",
  "end_time": "2024-03-25T12:00:00+07:00",
  "max_workers": 3,
  "auto_assign": false
}

// Response 201
{ "shift": { "id": "uuid", "status": "open", ... } }
```

#### `GET /api/shifts` `[S|E]`
- Employer: tất cả shift của mình, filter: `?job_id=&status=&date=`
- Student: tất cả shift `status=open` của jobs đang active, filter: `?date=&job_id=`

#### `GET /api/shifts/:id` `[S|E]`
Chi tiết shift, bao gồm danh sách workers đã đăng ký.

#### `PUT /api/shifts/:id` `[E]`
Sửa shift (chỉ khi status=open).

#### `DELETE /api/shifts/:id` `[E]`
Huỷ shift, tự động gửi thông báo cho các student đã đăng ký.

#### `POST /api/shifts/:id/register` `[S]`
Đăng ký vào ca làm.
```
// Response 201
{ "registration": { "id": "uuid", "status": "pending", ... } }

// Error 409: nếu conflict lịch hoặc đã đăng ký
{ "error": "SHIFT_CONFLICT", "message": "Trùng ca với shift ID xyz" }
```

#### `GET /api/shifts/:id/registrations` `[E]`
Danh sách ứng viên đăng ký ca.

#### `PATCH /api/shifts/:id/registrations/:reg_id` `[E]`
Duyệt hoặc từ chối đăng ký.
```json
{ "status": "approved" }  // "approved" | "rejected"
```

#### `DELETE /api/shifts/:id/register` `[S]`
Huỷ đăng ký ca (trừ điểm nếu < 24h trước ca).

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
// Response: cập nhật check_out_time, tính hours_worked
```

#### `GET /api/attendance` `[S]`
Lịch sử chấm công của student. Query: `?page=1&limit=20&status=`

#### `GET /api/attendance/shift/:shift_id` `[E]`
Danh sách chấm công của 1 ca (employer xem).

#### `PATCH /api/attendance/:id` `[E]`
Chỉnh sửa thủ công (note, override status).

---

### 2.5 Payroll Module — `/api/payroll`

#### `GET /api/payroll` `[S]`
Lịch sử lương của student. Query: `?period=week|month&year=2024&month=3`

#### `GET /api/payroll/:id` `[S]`
Chi tiết 1 kỳ lương, bao gồm `payroll_items[]`.

#### `GET /api/payroll/employer` `[E]`
Bảng lương tất cả nhân viên theo kỳ. Query: `?period_start=&period_end=`

#### `POST /api/payroll/calculate` `[E]`
Kích hoạt tính lương thủ công cho 1 kỳ.
```json
{ "period_start": "2024-03-01", "period_end": "2024-03-31" }
```

#### `PATCH /api/payroll/:id/confirm` `[E]`
Xác nhận bảng lương (status: draft → confirmed).

#### `PATCH /api/payroll/:id/paid` `[E]`
Đánh dấu đã thanh toán (status: confirmed → paid).

#### `GET /api/payroll/:id/export` `[E]`
Xuất file PDF hoặc Excel. Query: `?format=pdf|excel`

---

### 2.6 Notification Module — `/api/notifications`

#### `GET /api/notifications` `[S|E]`
Danh sách thông báo của user. Query: `?is_read=false&limit=20`

#### `PATCH /api/notifications/:id/read` `[S|E]`
Đánh dấu 1 thông báo đã đọc.

#### `PATCH /api/notifications/read-all` `[S|E]`
Đánh dấu tất cả đã đọc.

---

### 2.7 Report Module — `/api/reports` `[E]`

#### `GET /api/reports/overview`
Thống kê tổng quan: tổng ca, tổng giờ, chi phí tháng này.

#### `GET /api/reports/shifts`
Thống kê ca theo thời gian. Query: `?from=&to=`

#### `GET /api/reports/performance`
Hiệu suất nhân viên: số ca, tỉ lệ đúng giờ, reputation score.

#### `GET /api/reports/payroll-summary`
Tổng chi phí nhân sự theo tháng.

---

### 2.8 Admin Module — `/api/admin` `[A]`

#### `GET /api/admin/users`
Danh sách tất cả user. Filter: `?role=&is_active=&page=`

#### `PATCH /api/admin/users/:id/toggle-status`
Khoá / mở khoá tài khoản.

#### `GET /api/admin/jobs`
Tất cả job trong hệ thống.

#### `GET /api/admin/stats`
Thống kê hệ thống: tổng user, tổng job, tổng ca, tổng doanh thu.

---

## 3. Middleware

### `authMiddleware.ts`
```typescript
// Verify JWT từ Authorization header
// Gắn req.user = { id, email, role }
// Trả 401 nếu token không hợp lệ hoặc hết hạn
```

### `roleGuard.ts`
```typescript
// roleGuard('employer') → 403 nếu req.user.role !== 'employer'
// roleGuard('student', 'employer') → cho phép nhiều role
```

### `errorHandler.ts`
```typescript
// Global error handler — chuẩn hoá response lỗi:
{
  "error": "ERROR_CODE",
  "message": "Mô tả lỗi",
  "details": {}   // optional, Zod validation errors
}
```

### `validate.ts`
```typescript
// Zod schema validation middleware
// validate(schema) → 400 nếu body/query/params không hợp lệ
```

---

## 4. Socket.io Events (Server)

```typescript
// Khi user connect: join room 'user_<user_id>'
io.on('connection', (socket) => {
  socket.on('join:room', ({ room }) => socket.join(room))
  socket.on('join:shift', ({ shift_id }) => socket.join(`shift_${shift_id}`))
})

// Emit helper
function notify(userId: string, event: string, data: object) {
  io.to(`user_${userId}`).emit(event, data)
}

// Events emitted:
// notification:new    → khi tạo notification mới
// attendance:update   → khi student checkin/out
// shift:registered    → khi student đăng ký ca
// shift:approved      → khi employer duyệt ca
// payroll:updated     → khi tính lương xong
// shift:reminder      → từ background job
```

---

## 5. Background Jobs

### `autoAssignShift.ts`
- **Trigger**: khi tạo shift mới với `auto_assign=true`
- **Logic**:
  1. Query students có reputation_score cao nhất
  2. Kiểm tra conflict lịch từng student
  3. Auto-tạo `shift_registration` với status=`approved`
  4. Gửi notification cho từng student được gán
  5. Cập nhật `shift.current_workers`

### `autoCalcPayroll.ts`
- **Schedule**: `CRON_PAYROLL_SCHEDULE` (mặc định 00:00 hàng ngày)
- **Logic**:
  1. Tìm tất cả attendance `status != pending` chưa có payroll_item
  2. Tính `base_pay`, `bonus`, `penalty` theo công thức (xem system-design)
  3. Tạo/cập nhật `payroll` record theo kỳ tháng
  4. Emit `payroll:updated` cho student

### `sendReminders.ts`
- **Schedule**: `CRON_REMINDER_SCHEDULE` (mặc định mỗi 30 phút)
- **Logic**:
  1. Query shifts bắt đầu trong vòng 1 giờ tới
  2. Lấy danh sách student đã được duyệt
  3. Tạo notification + emit `shift:reminder`

---

## 6. Business Logic Rules

### Conflict Detection
```
Một student KHÔNG được đăng ký ca mới nếu:
  EXISTS attendance với shift có:
    (new_shift.start_time < existing_shift.end_time)
    AND
    (new_shift.end_time > existing_shift.start_time)
    AND status IN ('pending', 'approved')
```

### Late Detection
```
check_in_time > shift.start_time + 5 minutes → status = 'late'
late_minutes = EXTRACT(EPOCH FROM (check_in_time - shift.start_time)) / 60
```

### Absent Detection
```
Background job (sau 30 phút kể từ shift.start_time):
  attendance.check_in_time IS NULL → status = 'absent'
  → Trừ reputation, gửi notification cho employer
```

### hours_worked Calculation
```
hours_worked = EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600
             (capped tại shift duration nếu check_out_time > shift.end_time)
```
