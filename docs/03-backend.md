# 03 — Backend Specification
## Smart Workforce Platform

## Role

**Persona**: Backend Engineer & API Contract Owner
**Primary Focus**: Đặc tả REST endpoint, middleware chain, Socket.io event emission, background job logic, và business rule implementation phía server.
**Perspective**: Bạn đang định nghĩa contract mà frontend phải consume và tests phải verify. Mỗi endpoint bạn định nghĩa tạo ra nghĩa vụ đồng thời trên 3 file khác. Tư duy theo hướng: "Response shape này có khớp với TypeScript types của frontend không? Business rule này có khớp với công thức trong system design không? Error code này có test case tương ứng không?"

### Responsibilities
- Định nghĩa mỗi REST endpoint: method, path, auth requirements, request body, response shape, error codes
- Đặc tả middleware behavior: authMiddleware (JWT verify, req.user), roleGuard (role enforcement), validate (Zod), errorHandler
- Định nghĩa Socket.io event emission: service nào emit event nào, đến room nào, với payload gì
- Đặc tả background job logic: điều kiện trigger, SQL queries, side effects, cron schedule
- Document server-side business rules: conflict detection SQL, late detection logic, absent detection, hours_worked cap

### Cross-Role Awareness
| Khi bạn làm điều này... | Tham chiếu file này | Vì... |
|--------------------------|---------------------|-------|
| Thêm hoặc thay đổi endpoint | `docs/04-frontend.md` §8 | Function tương ứng trong `src/api/*.ts` phải được thêm/cập nhật |
| Thay đổi tên hoặc kiểu field trong response | `docs/04-frontend.md` §4 | Zustand store interfaces và TypeScript types phụ thuộc vào tên field chính xác |
| Thêm Socket.io event mới (server → client) | `docs/04-frontend.md` §6 | Handler `socket.on()` phải được thêm vào frontend hook tương ứng |
| Thêm role guard mới cho route | `docs/04-frontend.md` §9 | `RoleRoute` và `ProtectedRoute` enforce cùng role ở UI level |
| Thay đổi business rule (conflict, late, absent) | `docs/01-system-design.md` | Định nghĩa rule chuẩn tắc nằm ở đó; phải nhất quán |
| Thay đổi business rule (conflict, late, absent) | `docs/05-testing.md` §3 | Integration test cases encode boundary conditions của rule cụ thể |
| Thêm/thay đổi background job schedule | `docs/02-project-init.md` | Cron env var phải được thêm/cập nhật trong `.env.example` |
| Thêm module folder mới | `docs/02-project-init.md` | Cây thư mục phải được cập nhật để phản ánh module mới |

### Files to Consult First
- `docs/01-system-design.md` — xác minh DB schema hỗ trợ query đang viết
- `docs/04-frontend.md` — xác nhận response shape khớp TypeScript types trước khi finalize contract
- `docs/05-testing.md` — đảm bảo test tương ứng tồn tại hoặc cần được thêm cho endpoint mới

---

## 1. Module Breakdown

| Module | Chức năng |
|--------|-----------|
| **Auth** | Đăng nhập, profile (employer tự đăng ký; student do employer tạo) |
| **Job** | CRUD job (employer), list jobs (student) |
| **Shift** | CRUD shift, đăng ký ca, duyệt/từ chối, weekly scheduling |
| **Attendance** | Check-in, check-out, xem lịch sử |
| **Payroll** | Tính lương, xem bảng lương, xuất file |
| **Notification** | Gửi, xem, đánh dấu đã đọc |
| **Rating** | Employer đánh giá student sau ca, tính vào reputation |
| **Report** | Thống kê ca, hiệu suất, chi phí nhân sự |
| **Admin** | Quản lý user, khoá tài khoản, xem stats toàn hệ thống |

---

## 2. REST API Endpoints

### Base URL: `/api`

> **Auth headers**: `Authorization: Bearer <token>`
> **Role guards**: `[S]` = Student, `[E]` = Employer, `[A]` = Admin

---

### 2.1 Auth Module — `/api/auth`

> **User creation policy**: Chỉ employer mới tự đăng ký được. Student KHÔNG có chức năng tự đăng ký — tài khoản student do employer tạo qua endpoint riêng.

#### `POST /api/auth/register`
Đăng ký tài khoản employer mới (chỉ dành cho employer).
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
  "message": "Đăng ký thành công",
  "user": { "id": "uuid", "email": "...", "role": "employer" },
  "token": "eyJ..."
}
```

#### `POST /api/employers/employees` `[E]`
Employer tạo tài khoản student (nhân viên mới).
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
  "message": "Tạo tài khoản nhân viên thành công",
  "user": { "id": "uuid", "email": "...", "role": "student" },
  "temp_password": "Auto-generated, sent to employee's email"
}
```

#### `GET /api/employers/employees` `[E]`
Danh sách nhân viên (student) của employer. Query: `?is_active=true&page=1&limit=20`

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
```json
// Response 201
{ "registration": { "id": "uuid", "status": "pending", "registered_at": "..." } }

// Error 409: nếu đã đăng ký ca này rồi
{ "error": "ALREADY_REGISTERED", "message": "Bạn đã đăng ký ca này rồi" }

// Error 400: nếu shift đã qua deadline (Chủ nhật 12:00 trưa)
{ "error": "REGISTRATION_CLOSED", "message": "Đã quá hạn đăng ký ca tuần này" }
```
> **Không kiểm tra conflict**: Student có thể đăng ký nhiều ca trùng giờ. Scheduler sẽ giải quyết conflict khi chạy.

#### `POST /api/shifts/:id/assign` `[E]`
Employer manually assign student vào ca (dùng khi ca ít người trước deadline).
```json
// Request
{ "student_id": "uuid" }

// Response 201
{ "registration": { "id": "uuid", "status": "approved", ... } }

// Error 400: nếu ca đã full
{ "error": "SHIFT_FULL", "message": "Ca đã đủ người" }
```

#### `GET /api/shifts/:id/registrations` `[E]`
Danh sách ứng viên đăng ký ca.

#### `PATCH /api/shifts/:id/registrations/:reg_id` `[E]`
Duyệt hoặc từ chối đăng ký.
```json
{ "status": "approved" }  // "approved" | "rejected"
```

#### `DELETE /api/shifts/:id/register` `[S]`
Huỷ đăng ký ca.
```
Business rule:
- Nếu registration.status=approved trước khi hủy → shift.current_workers -= 1, slot mở lại
- Hủy khi shift chưa bắt đầu VÀ ≥ 24h trước start_time → status=cancelled, KHÔNG trừ reputation
- Hủy khi shift chưa bắt đầu VÀ < 24h trước start_time → status=cancelled, trừ -7.0 reputation
- Hủy không được nếu shift đã ongoing hoặc completed
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
// Response: cập nhật check_out_time, tính hours_worked
```

#### `GET /api/attendance` `[S]`
Lịch sử chấm công của student. Query: `?page=1&limit=20&status=`

#### `GET /api/attendance/shift/:shift_id` `[E]`
Danh sách chấm công của 1 ca (employer xem).

#### `PATCH /api/attendance/:id` `[E]`
Chỉnh sửa thủ công (note, override status).

#### `PATCH /api/attendance/:id/force-complete` `[E]`
Employer force-checkout student từ xa khi ca đã kết thúc mà student chưa checkout.
```
Preconditions:
  - shift.end_time đã qua (ca đã kết thúc)
  - attendance.status = 'incomplete' (student đã check-in nhưng chưa checkout)
  - Employer phải là owner của shift đó

Limit: tối đa 3 lần / student / calendar month

Response 200: attendance record đã cập nhật (hours_worked, status, force_checkout=true)

Errors:
  403 FORCE_CHECKOUT_LIMIT_EXCEEDED — đã dùng hết 3 lần cho student này tháng này
  400 SHIFT_NOT_ENDED           — ca chưa kết thúc
  409 ALREADY_COMPLETED         — student đã checkout rồi
  403 FORBIDDEN                 — employer không phải owner của shift
```

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

### 2.8 Rating Module — `/api/ratings`

#### `POST /api/ratings` `[E]`
Employer đánh giá student sau khi ca kết thúc.
```json
// Request
{
  "shift_id": "uuid",
  "student_id": "uuid",
  "score": 4,          // 1–5
  "comment": "Nhân viên làm việc tốt, đúng giờ"
}

// Response 201
{ "rating": { "id": "uuid", "score": 4, "created_at": "..." } }

// Error 400: nếu ca chưa completed
{ "error": "SHIFT_NOT_COMPLETED", "message": "Chỉ được đánh giá sau khi ca kết thúc" }
// Error 409: nếu đã đánh giá rồi
{ "error": "ALREADY_RATED", "message": "Bạn đã đánh giá nhân viên này cho ca làm này" }
```
> **Side effect**: Tự động cập nhật reputation_score của student:
> - score 4–5: +5.0 (good_review event)
> - score 3: không thay đổi
> - score 1–2: -8.0 (bad_review event)

#### `GET /api/ratings/student/:student_id` `[E|S]`
Xem lịch sử đánh giá của 1 student. Query: `?page=1&limit=10`

---

### 2.9 Admin Module — `/api/admin` `[A]`

#### `GET /api/admin/users`
Danh sách tất cả user. Filter: `?role=&is_active=&page=`

#### `PATCH /api/admin/users/:id/toggle-status`
Khoá / mở khoá tài khoản.

#### `GET /api/admin/jobs`
Tất cả job trong hệ thống.

#### `GET /api/admin/stats`
Thống kê hệ thống: tổng user, tổng job, tổng ca, tổng doanh thu.

#### `POST /api/admin/employers`
Admin tạo employer account mới. Body: `{ email, password, company_name, address?, description? }`
Response `201`: `{ user, employer_profile, temp_password }`

#### `GET /api/admin/employers/:id/shifts`
Xem tất cả shifts của 1 employer cụ thể. Filter: `?status=&page=`

#### `GET /api/admin/employers/:id/payroll`
Xem tất cả payroll records của 1 employer cụ thể. Filter: `?month=&year=`

#### `PATCH /api/admin/payroll/:id`
Admin override payroll record (điều chỉnh thủ công). Body: `{ total_amount?, note? }`
Response `200`: updated payroll record.

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

### `weeklyScheduler.ts` (thay thế autoAssignShift.ts)
- **Schedule**: `0 0 * * 1` — 0:00 sáng thứ Hai hàng tuần
- **Registration deadline**: Chủ nhật 12:00 trưa (hệ thống không chặn đăng ký sau deadline, nhưng scheduler chỉ xử lý registrations được tạo trước deadline)
- **Logic**:
  1. Query tất cả `shift_registrations` có status=`pending` với `shift.start_time` trong tuần tới
  2. Nhóm theo `shift_id`
  3. Với mỗi shift: sort students theo `reputation_score DESC, registered_at ASC`
  4. Lấy tối đa `shift.max_workers` students đầu tiên, kiểm tra conflict chéo giữa các ca
  5. Approved students: `status=approved`, tăng `shift.current_workers`
  6. Rejected students (quá max hoặc conflict): `status=rejected`
  7. Gửi notification cho TẤT CẢ students (approved và rejected)
  8. Log kết quả scheduling

### `lowRegistrationAlert.ts` (tích hợp vào `sendReminders.ts`)
- **Schedule**: `0 11 * * 0` — 11:00 sáng Chủ nhật (1 giờ trước deadline)
- **Logic**:
  1. Query tất cả shifts của tuần tới có `current_workers = 0` (chưa có ai được approve)
  2. Với mỗi shift đó, đếm pending registrations
  3. Nếu `pending_count < max_workers` → emit `shift:low_registration` cho employer
  4. Employer có 1 giờ để manually assign trước khi deadline 12:00 trưa

### `autoDetectAbsent.ts`
- **Schedule**: Chạy mỗi 30 phút (tích hợp vào `sendReminders.ts`)
- **Logic**:
  1. Query shifts có `start_time <= NOW() - 30 minutes` và `status=ongoing`
  2. Tìm shift_registrations `status=approved` nhưng chưa có attendance record
  3. Tạo attendance record với `status=absent`
  4. Trừ -10.0 reputation, gửi notification cho employer

### `autoCalcPayroll.ts`
- **Trigger**: Gọi ngay sau khi shift hoàn thành (checkout hoặc `autoDetectAbsent` marks absent) — **real-time per shift**, không phải batch hàng ngày
- **Schedule fallback**: `CRON_PAYROLL_SCHEDULE` (mặc định 00:00 hàng ngày) — catch-up cho bất kỳ attendance nào bị bỏ sót
- **Logic**:
  1. Tìm tất cả attendance `status != pending` chưa có payroll_item
  2. Tính `base_pay`, `bonus`, `penalty` theo công thức (xem system-design)
  3. Tạo `payroll_item` cho từng attendance record ngay lập tức (cộng dồn)
  4. Tạo/cập nhật `payroll` record (tổng kết theo kỳ tháng) — `total_amount` = tổng tất cả payroll_items trong kỳ
  5. Emit `payroll:updated` cho student

### `sendReminders.ts`
- **Schedule**: `CRON_REMINDER_SCHEDULE` (mặc định mỗi 30 phút)
- **Logic**:
  1. Query shifts bắt đầu trong vòng 1 giờ tới
  2. Lấy danh sách student đã được duyệt
  3. Tạo notification + emit `shift:reminder`

---

## 6. Business Logic Rules

### Conflict Detection (chỉ áp dụng trong Scheduler, KHÔNG áp dụng khi đăng ký)
```
Scheduler giải quyết conflict khi chạy lúc 0:00 thứ Hai:
  Với mỗi student, sau khi approve một ca:
    Reject tất cả pending registrations khác của student đó nếu:
      (approved_shift.start_time < other_shift.end_time)
      AND
      (approved_shift.end_time > other_shift.start_time)
    → Ưu tiên ca có reputation phù hợp hơn, sau đó ca đăng ký sớm hơn

> Tại thời điểm student POST /shifts/:id/register: KHÔNG check conflict.
> Student được phép đăng ký nhiều ca trùng giờ.
```

### Timezone
```
Tất cả TIMESTAMPTZ trong DB lưu theo UTC+7 (Asia/Ho_Chi_Minh).
Server và frontend đều dùng UTC+7.
Không cần convert timezone — lưu gì hiển thị vậy.
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

### Shift Status Transitions (Tự động hoàn toàn)
```
open    → full      : Khi shift.current_workers == shift.max_workers (sau mỗi approval)
full    → open      : Khi student hủy đăng ký approved (current_workers giảm < max_workers)
open/full → ongoing : Background job lúc shift.start_time (mỗi phút check)
ongoing → completed : Background job lúc shift.end_time (mỗi phút check)
any     → cancelled : Employer gọi DELETE /api/shifts/:id — tự động notify students
```

### Payroll total_pay Clamp
```
total_pay = GREATEST(0, base_pay + bonus - penalty)
-- Không cho phép total_pay âm. Nếu penalty > base_pay + bonus → total_pay = 0
```

### Employer Cancel Shift
```
Khi employer DELETE /shifts/:id:
  - Tất cả shift_registrations status=approved/pending → cancelled
  - Student KHÔNG bị trừ reputation (employer là người hủy)
  - Gửi notification cho tất cả student đã đăng ký
```

### Health Check
```
GET /api/health → 200 { "status": "ok", "db": "connected", "uptime": 12345 }
                → 503 { "status": "error", "db": "disconnected" } nếu DB không kết nối được
```
