# 01 — System Design
## Smart Workforce Platform

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
Student → POST /shifts/:id/register
       → Backend: kiểm tra conflict lịch
       → Nếu OK: tạo shift_registration (status=pending)
       → Employer nhận notification qua Socket.io
       → Employer duyệt → shift_registration.status=approved
       → Student nhận notification: "Ca đã được duyệt"
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
  → hourly_rate × hours_worked + bonus - penalty
  → Lưu payroll record
  → Emit Socket.io: payroll:updated → Student nhận thông báo lương
```

### 3.4 Auto-assign shift
```
Background Job (khi employer tạo shift mới)
  → Query students: role=student, available, reputation_score cao nhất
  → Kiểm tra conflict với lịch hiện tại
  → Gán students vào shift (hoặc gửi thông báo mời đăng ký)
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
  status          ENUM('on_time', 'late', 'absent', 'pending') DEFAULT 'pending',
  late_minutes    INT DEFAULT 0,
  hours_worked    DECIMAL(5,2),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
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
  base_amount     DECIMAL(12,2),
  bonus_amount    DECIMAL(12,2) DEFAULT 0,
  penalty_amount  DECIMAL(12,2) DEFAULT 0,
  total_amount    DECIMAL(12,2),
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
  hours_worked    DECIMAL(5,2),
  hourly_rate     DECIMAL(10,2),
  subtotal        DECIMAL(12,2),
  bonus           DECIMAL(12,2) DEFAULT 0,
  penalty         DECIMAL(12,2) DEFAULT 0
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
| Đánh giá xấu từ employer (1–2 sao) | -8.0 |

### Ảnh hưởng đến auto-assign
- Score ≥ 150: Ưu tiên cao nhất
- Score 100–149: Ưu tiên bình thường
- Score 50–99: Ưu tiên thấp
- Score < 50: Tạm khoá tự động đăng ký

---

## 7. Bonus / Penalty Formula

```
base_pay      = hours_worked × hourly_rate

bonus         = IF (on_time AND hours_worked >= shift_hours) THEN base_pay × 0.05 ELSE 0

penalty       = IF (late_minutes > 0 AND late_minutes <= 15) THEN base_pay × 0.02
                ELSE IF (late_minutes > 15) THEN base_pay × 0.05
                ELSE 0

total_pay     = base_pay + bonus - penalty
```
