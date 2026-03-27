# 01 — System Design
## Smart Workforce Platform

## Role

**Persona**: Database Architect & Systems Designer
**Primary Focus**: Mô hình dữ liệu chuẩn tắc, kiến trúc hệ thống, luồng dữ liệu, và các công thức tính toán nghiệp vụ.
**Perspective**: Mọi quyết định ở đây là nguồn sự thật (source of truth) mà tất cả các layer khác phải tuân theo. Khi thiết kế hoặc chỉnh sửa file này, hãy tư duy theo hướng tính toàn vẹn dữ liệu, ràng buộc tham chiếu, và các nghĩa vụ contract với downstream — không phải sự tiện lợi khi implement.

### Responsibilities
- Định nghĩa và duy trì DB schema (cấu trúc bảng, kiểu dữ liệu, constraints, indexes)
- Sở hữu tất cả data flow diagrams (đăng ký ca, check-in, tính lương, auto-assign)
- Định nghĩa Socket.io event map (tên event, payload shape, người nhận)
- Định nghĩa công thức nghiệp vụ: tính lương (bonus/penalty), thuật toán reputation score
- Xác lập các tập enum value mà Zod schemas ở backend và Badge components ở frontend phụ thuộc vào

### Cross-Role Awareness
| Khi bạn làm điều này... | Tham chiếu file này | Vì... |
|--------------------------|---------------------|-------|
| Thêm hoặc đổi tên cột DB | `docs/03-backend.md` | API response shapes và Zod schemas phải phản ánh thay đổi |
| Thêm hoặc đổi tên cột DB | `docs/04-frontend.md` | TypeScript interfaces trong `frontend/src/types/` phải đồng bộ |
| Thêm/sửa Socket.io event | `docs/04-frontend.md` §6 | Frontend socket hooks lắng nghe đúng tên event định nghĩa ở đây |
| Thay đổi công thức lương (§7) | `docs/05-testing.md` §2 | `payrollCalc.test.ts` encode giá trị công thức cụ thể |
| Thay đổi delta reputation | `docs/05-testing.md` §2 | `reputationCalc.test.ts` assert các số cụ thể |
| Thêm enum value mới (vd: shift status) | `docs/03-backend.md` §2 | Zod schemas validate theo enum set; `docs/04-frontend.md` Badge.tsx map màu theo enum |
| Thay đổi foreign key hoặc cascade rule | `docs/02-project-init.md` | Thứ tự migration file và rollback plan phải được cập nhật |

### Files to Consult First
- `docs/03-backend.md` — xác minh API contract nhất quán với thay đổi schema
- `docs/04-frontend.md` — xác minh TypeScript types và socket hook event names đồng bộ
- `docs/05-testing.md` — cập nhật test assertions khi constants công thức thay đổi

---

## 1. Tổng Quan Hệ Thống

**Smart Workforce Platform** là hệ thống quản lý và tự động hóa nhân sự dành cho sinh viên part-time. Hệ thống cho phép doanh nghiệp tạo job, quản lý ca làm, chấm công và tính lương tự động; sinh viên có thể đăng ký ca, check-in/out, xem lương real-time.

### Actors
| Actor | Mô tả |
|-------|-------|
| **Student** | Sinh viên part-time: đăng ký ca, check-in/out, xem lương, nhận thông báo |
| **Employer** | Doanh nghiệp: tạo job, quản lý ca, duyệt ứng viên, tính lương, xuất báo cáo |
| **Admin** | Quản trị hệ thống: quản lý user, job, xem thống kê toàn hệ thống |

---

## 2. Kiến Trúc Tổng Thể

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
│              │     PostgreSQL       │                             │
│              │  (primary database) │                             │
│              └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Luồng Dữ Liệu Chính

### 3.1 Đăng ký ca (Student)
```
Employer publish shifts cho tuần tới
  → Hệ thống gửi notification cho tất cả students: "Đăng ký ca tuần tới đã mở"
  → Student vào app, xem danh sách ca, chọn các ca muốn làm
  → POST /shifts/:id/register → tạo shift_registration (status=pending)
  → Không kiểm tra conflict tại bước này — student được đăng ký nhiều ca trùng giờ
  → Deadline: Chủ nhật 12:00 trưa (sau deadline scheduler xử lý)
  → Employer có thể approve/reject thủ công bất lúc nào trong tuần
  → 0:00 thứ Hai: scheduler tự động xử lý tất cả pending registrations còn lại
  → Student nhận notification kết quả (approved/rejected)
```

### 3.2 Check-in / Check-out
```
Student → POST /attendance/checkin  { shift_id, location? }
        → Backend: so sánh giờ thực vs shift.start_time
        → Tính status: on_time | late | absent
        → Lưu attendance record
        → Emit Socket.io event: attendance:update → Employer dashboard
```

### 3.3 Tính lương tự động
```
Background Job (mỗi ngày 00:00 hoặc khi shift kết thúc)
  → Query attendance đã completed trong kỳ
  → hourly_rate × hours_worked (thời gian thực tế)
  → Lưu payroll record
  → Emit Socket.io: payroll:updated → Student nhận thông báo lương
```

### 3.4 Weekly Scheduling Job (Auto-assign)
```
Chu kỳ lập lịch hàng tuần:

1. Employer tạo shifts cho tuần tới (bất kỳ lúc nào trong tuần)
2. Student đăng ký các ca muốn làm (deadline: Chủ nhật 12:00 trưa)
   → Student CÓ THỂ đăng ký nhiều ca trùng giờ — hệ thống không chặn
   → Trước 12:00 trưa: nếu ca nào chưa có đăng ký → hệ thống cảnh báo employer
3. Background Job chạy lúc 0:00 thứ Hai:
   a. Thu thập tất cả shift_registrations status=pending của tuần tới
   b. Với mỗi ca có nhiều người đăng ký hơn max_workers:
      → Ưu tiên student có reputation_score cao hơn
      → Trong cùng band điểm: ưu tiên đăng ký sớm hơn (registered_at)
   c. Kiểm tra conflict: student không được assigned 2 ca trùng giờ
   d. Approved: cập nhật status=approved, tăng shift.current_workers
   e. Rejected: cập nhật status=rejected (quá max_workers hoặc conflict)
   f. Gửi notification cho tất cả student (approved hoặc rejected)
4. Employer review kết quả và có thể chỉnh sửa thủ công
```

---

## 4. Database Schema (ERD)

### Bảng `users`
```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          ENUM('student', 'employer', 'admin') NOT NULL,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `employer_profiles`
```sql
employer_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name  VARCHAR(255) NOT NULL,
  address       TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `student_profiles`
```sql
student_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  employer_id     UUID REFERENCES users(id),  -- employer quản lý student này (1 student chỉ thuộc 1 employer)
  student_id      VARCHAR(50),          -- mã sinh viên
  university      VARCHAR(255),
  skills          TEXT[],               -- mảng kỹ năng
  reputation_score DECIMAL(4,2) DEFAULT 100.00,
  total_shifts_done INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `jobs`
```sql
jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  hourly_rate     DECIMAL(10,2) NOT NULL,
  required_skills TEXT[],
  max_workers     INT NOT NULL,
  status          ENUM('active', 'paused', 'closed') DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `shifts`
```sql
shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id     UUID REFERENCES users(id),
  title           VARCHAR(255),
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  max_workers     INT NOT NULL,
  current_workers INT DEFAULT 0,
  status          ENUM('open', 'full', 'ongoing', 'completed', 'cancelled') DEFAULT 'open',
  auto_assign     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `shift_registrations`
```sql
shift_registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID REFERENCES shifts(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  status      ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES users(id),
  UNIQUE(shift_id, student_id)
)
```

### Bảng `attendance`
```sql
attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id        UUID REFERENCES shifts(id),
  student_id      UUID REFERENCES users(id),
  check_in_time   TIMESTAMPTZ,
  check_out_time  TIMESTAMPTZ,
  status          ENUM('on_time', 'late', 'absent', 'incomplete', 'pending') DEFAULT 'pending',
  late_minutes    INT DEFAULT 0,        -- phút đến trễ so với shift.start_time
  early_minutes   INT DEFAULT 0,        -- phút về sớm so với shift.end_time
  hours_worked    DECIMAL(5,2),         -- = (shift_duration - late_minutes - early_minutes) / 60
  force_checkout  BOOLEAN DEFAULT FALSE,       -- employer đã force-close ca này
  force_checkout_by UUID REFERENCES users(id), -- employer_id thực hiện force-checkout
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
-- incomplete = student đã check-in nhưng ca kết thúc mà không check-out; hours_worked = 0
```

### Bảng `payroll`
```sql
payroll (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES users(id),
  employer_id     UUID REFERENCES users(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_hours     DECIMAL(7,2),
  total_amount    DECIMAL(12,2),  -- = SUM(payroll_items.subtotal)
  status          ENUM('draft', 'confirmed', 'paid') DEFAULT 'draft',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `payroll_items` (chi tiết từng ca)
```sql
payroll_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id      UUID REFERENCES payroll(id) ON DELETE CASCADE,
  shift_id        UUID REFERENCES shifts(id),
  attendance_id   UUID REFERENCES attendance(id),
  scheduled_hours   DECIMAL(5,2),             -- giờ ca gốc theo lịch (shift_duration)
  hours_worked      DECIMAL(5,2),             -- = scheduled_hours - (late_minutes + early_minutes)/60
  hourly_rate       DECIMAL(10,2),
  deduction_minutes INT DEFAULT 0,            -- late_minutes + early_minutes
  deduction_amount  DECIMAL(12,2) DEFAULT 0,  -- = deduction_minutes/60 × hourly_rate
  subtotal          DECIMAL(12,2)             -- = scheduled_hours × hourly_rate - deduction_amount
)
```

### Bảng `notifications`
```sql
notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,  -- shift_approved, payroll_ready, shift_reminder, etc.
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT false,
  metadata    JSONB,                 -- { shift_id, payroll_id, ... }
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### Bảng `ratings`
```sql
ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID REFERENCES shifts(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score       INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, student_id)  -- mỗi shift chỉ được rate 1 lần
)
```

### Bảng `reputation_events`
```sql
reputation_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(50),  -- on_time_checkin, late_checkin, absent, good_review, etc.
  delta       DECIMAL(5,2), -- +2.0, -5.0, etc.
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 5. Socket.io Event Map

### Server → Client Events
| Event | Payload | Người nhận |
|-------|---------|------------|
| `notification:new` | `{ id, type, title, body, metadata }` | User cụ thể |
| `attendance:update` | `{ shift_id, student_id, status, check_in_time }` | Employer |
| `shift:registered` | `{ shift_id, student_id, student_name }` | Employer |
| `shift:approved` | `{ shift_id, registration_id }` | Student |
| `shift:rejected` | `{ shift_id, registration_id, reason }` | Student |
| `shift:low_registration` | `{ shift_id, title, current_count, max_workers }` | Employer |
| `payroll:updated` | `{ payroll_id, total_amount, period }` | Student |
| `shift:reminder` | `{ shift_id, start_time, job_title }` | Student |

### Client → Server Events
| Event | Payload | Mô tả |
|-------|---------|-------|
| `join:room` | `{ room: 'user_<id>' }` | User join room cá nhân |
| `join:shift` | `{ shift_id }` | Employer join room theo dõi ca |

---

## 6. Reputation Score Algorithm

**Điểm khởi đầu**: 100.00 (thang điểm 0–200)

### Cộng điểm
| Sự kiện | Delta |
|---------|-------|
| Check-in đúng giờ | +2.0 |
| Hoàn thành đủ ca | +3.0 |
| Đánh giá tốt từ employer (4–5 sao) | +5.0 |

### Trừ điểm
| Sự kiện | Delta |
|---------|-------|
| Đi trễ (1–15 phút) | -2.0 |
| Đi trễ (>15 phút) | -5.0 |
| Vắng không báo trước | -10.0 |
| Huỷ ca sau khi được duyệt (<24h trước ca) | -7.0 |
| Huỷ ca sau khi được duyệt (≥24h trước ca) | 0 (không phạt) |
| Đánh giá xấu từ employer (1–2 sao) | -8.0 |

> **Lưu ý**: Nếu EMPLOYER huỷ ca (không phải student), student KHÔNG bị trừ điểm reputation.

### Ảnh hưởng đến auto-assign
- Score ≥ 150: Ưu tiên cao nhất
- Score 100–149: Ưu tiên bình thường
- Score 50–99: Ưu tiên thấp
- Score < 50: Tạm khoá tự động đăng ký

---

## 7. Payroll Formula

```
scheduled_pay    = shift_duration_hours × hourly_rate      -- lương nếu đi đúng giờ, đủ ca

late_deduction   = (late_minutes / 60) × hourly_rate       -- trừ phần đến muộn
early_deduction  = (early_minutes / 60) × hourly_rate      -- trừ phần về sớm

total_pay        = scheduled_pay - late_deduction - early_deduction
               ≡  hours_worked × hourly_rate               -- tương đương khi implement
```

**Quy tắc:**
- `late_minutes` = check_in_time - shift.start_time (nếu > 0, ngược lại = 0)
- `early_minutes` = shift.end_time - check_out_time (nếu > 0, ngược lại = 0)
- `hours_worked` = shift_duration - (late_minutes + early_minutes) / 60
- Đi đủ giờ, đúng giờ → `total_pay = scheduled_pay` (không trừ gì)
- Không có bonus/penalty phần trăm trong payroll
- Reputation vẫn bị trừ/cộng theo §6 — hoàn toàn tách biệt với lương
- `incomplete` attendance: `hours_worked = 0`, `total_pay = 0` (không tính lương ca đó)

### Payroll Period
- `period_start` = ngày 1 của tháng hiện tại
- `period_end` = ngày cuối tháng
- Auto-create: khi tạo `payroll_item` đầu tiên của tháng, tạo `payroll` record cho tháng đó nếu chưa có

### Cancel Approved Registration
```
Student cancel registration có status=approved:
  → registration.status = 'cancelled'
  → shift.current_workers -= 1
  → Slot mở lại (shift tiếp tục nhận đăng ký mới cho đến max_workers)
  → Áp dụng reputation penalty theo §6 (≥24h = 0, <24h = -7.0)
```

### Force-Checkout (Employer)
```
Điều kiện:
  - NOW() > shift.end_time (ca đã kết thúc)
  - Student đã check-in nhưng attendance.status = 'incomplete' (chưa checkout)
  - employer_id = shift.job.employer_id

Limit: tối đa 3 lần / student / calendar month
  - Đếm attendance records của student đó có force_checkout=TRUE trong tháng

Khi thực hiện:
  - check_out_time = NOW()
  - hours_worked = (check_out_time - check_in_time) / 3600
  - early_minutes = MAX(0, shift.end_time - check_out_time) / 60  -- thường = 0 vì force sau khi ca kết thúc
  - status = 'on_time' hoặc 'late' (theo late_minutes đã có)
  - force_checkout = TRUE, force_checkout_by = employer_id
  - Trigger tính lương cho attendance này
```
