# 05 — Testing Specification
## Smart Workforce Platform

## Role

**Persona**: QA Engineer & Test Architect
**Primary Focus**: Testing strategy, đặc tả test cases, định nghĩa seed data, và coverage targets trên 4 testing layers.
**Perspective**: Tests là verification layer cho mọi contract được định nghĩa trong các file docs khác. Khi làm việc trong file này, trace mỗi test case về nguồn gốc: một business rule trong `01-system-design.md`, một API contract trong `03-backend.md`, một component behavior trong `04-frontend.md`, hoặc một user flow kết hợp cả ba. Test không thể trace về spec đã document hoặc là thừa, hoặc là spec đang thiếu.

### Responsibilities
- Định nghĩa four-layer test strategy và lựa chọn tooling
- Đặc tả unit test cases cho tất cả backend utility functions (payrollCalc, conflictCheck, reputationCalc)
- Đặc tả integration test cases cho mỗi API endpoint (happy path + primary error cases)
- Đặc tả frontend unit test cases cho components và Zustand stores
- Định nghĩa E2E test scenarios (happy paths only, full actor flows)
- Duy trì seed data definitions và thông tin đăng nhập test account cố định
- Định nghĩa và enforce coverage targets theo từng layer

### Cross-Role Awareness
| Khi bạn làm điều này... | Tham chiếu file này | Vì... |
|--------------------------|---------------------|-------|
| Viết unit test assertions với số cụ thể | `docs/01-system-design.md` §6-7 | Reputation delta values và payroll formula được định nghĩa chuẩn tắc ở đó |
| Viết integration tests cho endpoint | `docs/03-backend.md` §2 | Request shape, expected response, và error codes được định nghĩa ở đó |
| Viết frontend component unit tests | `docs/04-frontend.md` §3 | Component props, rendered states, và callback expectations được định nghĩa ở đó |
| Viết E2E test steps | `docs/04-frontend.md` §7 | UX flows định nghĩa sequence bước chính xác; E2E tests phải khớp |
| Thêm seed data cho bảng mới | `docs/01-system-design.md` §4 | Table schema và valid enum values được định nghĩa ở đó |
| Thêm seed data cho bảng mới | `docs/02-project-init.md` §9 | Thứ tự migration file xác định bảng nào tồn tại khi seed chạy |
| Tăng coverage targets | `docs/03-backend.md` | Endpoint mới không có integration tests làm giảm actual coverage dưới target |

### Files to Consult First
- `docs/01-system-design.md` — cho giá trị constant chính xác để assert trong unit tests
- `docs/03-backend.md` — cho API contract mà mỗi integration test đang verify
- `docs/04-frontend.md` — cho component và UX flow mà mỗi frontend test đang cover

---

## 1. Testing Strategy

| Layer | Tool | Mục tiêu |
|-------|------|----------|
| Unit (Backend) | Jest | Utility functions: payroll calc, conflict check, reputation |
| Integration (Backend) | Jest + Supertest | API endpoints với DB thật (test DB) |
| Unit (Frontend) | Vitest + RTL | Components, hooks, Zustand stores |
| E2E | Playwright | Happy path flows cho từng actor |

### Nguyên tắc
- Mỗi module backend cần ít nhất integration tests cho happy path + error cases chính
- Các utility functions (calc, conflict) phải có unit tests đầy đủ vì là business logic quan trọng
- E2E chỉ cover happy paths, không test edge cases

---

## 2. Backend — Unit Tests (Jest)

### `payrollCalc.test.ts`
```typescript
describe('calculatePay', () => {
  it('đủ ca đúng giờ → total_pay = shift_hours × hourly_rate (không trừ gì)')
  it('đi muộn 30 phút → trừ đúng: scheduled_pay - 0.5h × rate')
  it('về sớm 15 phút → trừ đúng: scheduled_pay - 0.25h × rate')
  it('vừa muộn vừa về sớm → trừ cả 2: scheduled_pay - (late + early)/60 × rate')
  it('không cho hours_worked > shift_duration')
})
```

### ~~`conflictCheck.test.ts`~~ — ĐÃ XÓA
> Conflict check không còn xảy ra tại layer đăng ký. Xem `weeklyScheduler.test.ts` cho conflict resolution logic.

### `weeklyScheduler.test.ts`
```typescript
describe('weeklyScheduler', () => {
  it('approved student có reputation cao nhất khi ca quá max_workers')
  it('rejected student nếu quá max_workers dù reputation đủ')
  it('tiebreaker: cùng reputation → ưu tiên đăng ký sớm hơn (registered_at ASC)')
  it('không approve student có conflict ca với ca đã được approve khác trong cùng lần chạy')
  it('bỏ qua registrations được tạo sau deadline Chủ nhật 12:00 trưa')
  it('bỏ qua shifts đã có current_workers == max_workers (đã đủ người từ manual approve)')
  it('gửi notification cho tất cả students (approved và rejected)')
  it('cập nhật shift.current_workers sau khi chạy')
})
```

### Integration test: `POST /shifts/:id/register`
```typescript
describe('registerShift', () => {
  it('student đăng ký 2 ca trùng giờ → cả 2 đều status=pending (không bị block)')
  it('student đăng ký ca đã đăng ký rồi → 409 ALREADY_REGISTERED')
  it('student đăng ký sau deadline 12:00 trưa Chủ nhật → 400 REGISTRATION_CLOSED')
})
```

### `cancelShift.test.ts`
```typescript
describe('cancelShiftRegistration', () => {
  it('hủy ≥24h trước ca → status=cancelled, reputation không thay đổi')
  it('hủy <24h trước ca → status=cancelled, reputation -7.0')
  it('hủy approved registration → current_workers giảm 1, slot mở lại')
  it('employer hủy ca → tất cả students cancelled, không ai mất reputation')
})
```

### `reputationCalc.test.ts`
```typescript
describe('calculateReputationDelta', () => {
  it('cộng +2 khi check-in đúng giờ')
  it('cộng +3 khi hoàn thành ca')
  it('trừ -2 khi trễ 1–15 phút')
  it('trừ -5 khi trễ > 15 phút')
  it('trừ -10 khi vắng không báo')
  it('trừ -7 khi huỷ ca trong vòng 24h')
  it('không cho score xuống dưới 0')
  it('không cho score vượt quá 200')
})
```

---

## 3. Backend — Integration Tests (Supertest)

Mỗi test file dùng DB test riêng, seed trước khi chạy và truncate sau khi xong.

### `auth.test.ts`
```typescript
describe('POST /api/auth/register', () => {
  it('201 — đăng ký student thành công, trả về token')
  it('201 — đăng ký employer thành công')
  it('400 — thiếu required fields')
  it('409 — email đã tồn tại')
})

describe('POST /api/auth/login', () => {
  it('200 — login thành công, trả về token + user info')
  it('401 — sai password')
  it('404 — email không tồn tại')
})

describe('GET /api/auth/me', () => {
  it('200 — trả về thông tin user + profile')
  it('401 — không có token')
  it('401 — token hết hạn')
})
```

### `shifts.test.ts`
```typescript
describe('POST /api/shifts/:id/register', () => {
  it('201 — đăng ký ca thành công')
  it('409 — conflict với ca đã đăng ký')
  it('409 — ca đã full')
  it('403 — employer không được đăng ký ca')
  it('404 — shift không tồn tại')
})

describe('PATCH /api/shifts/:id/registrations/:reg_id', () => {
  it('200 — duyệt đăng ký, current_workers tăng 1')
  it('200 — từ chối đăng ký')
  it('403 — student không được duyệt')
  it('403 — employer khác không được duyệt shift của người khác')
})
```

### `attendance.test.ts`
```typescript
describe('POST /api/attendance/checkin', () => {
  it('201 — checkin đúng giờ, status=on_time')
  it('201 — checkin trễ 10 phút, status=late, late_minutes=10')
  it('400 — chưa được duyệt vào ca này')
  it('409 — đã checkin rồi')
})

describe('POST /api/attendance/checkout', () => {
  it('200 — checkout thành công, tính đúng hours_worked')
  it('400 — chưa checkin')
})

describe('PATCH /api/attendance/:id/force-complete', () => {
  it('200 — employer force-checkout thành công, hours_worked và status được tính đúng')
  it('403 — đã force-checkout student này 3 lần trong tháng → FORCE_CHECKOUT_LIMIT_EXCEEDED')
  it('400 — ca chưa kết thúc → SHIFT_NOT_ENDED')
  it('409 — student đã checkout rồi → ALREADY_COMPLETED')
  it('403 — employer không phải owner của shift → FORBIDDEN')
})
```

### `payroll.test.ts`
```typescript
describe('POST /api/payroll/calculate', () => {
  it('200 — tính đúng tổng lương cho nhiều ca trong kỳ')
  it('200 — bao gồm các ca đi muộn và về sớm, tính đúng giờ thực tế')
  it('403 — student không được kích hoạt tính lương')
})
```

---

## 4. Frontend — Unit Tests (Vitest + React Testing Library)

### `Badge.test.tsx`
```typescript
it('hiển thị màu xanh cho status on_time')
it('hiển thị màu đỏ cho status absent')
it('hiển thị màu vàng cho status late')
```

### `CheckInButton.test.tsx`
```typescript
it('hiển thị nút CHECK IN khi chưa checkin')
it('hiển thị nút CHECK OUT sau khi checkin')
it('hiển thị "Không có ca" khi không trong giờ làm')
it('gọi checkIn() khi click nút')
it('disabled khi đang loading')
```

### `PayrollSummaryCard.test.tsx`
```typescript
it('hiển thị đúng tổng tiền')
it('hiển thị tổng giờ làm thực tế')
it('hiển thị hourly rate')
it('tính đúng total = total_hours × hourly_rate')
```

### `useAuthStore.test.ts`
```typescript
it('login lưu token và user vào store')
it('logout xoá token và user')
it('token được persist qua localStorage')
```

### `ShiftCalendar.test.tsx`
```typescript
it('render đúng số event theo data')
it('hiển thị màu vàng cho shift pending')
it('hiển thị màu xanh cho shift approved')
it('click vào event gọi onEventClick callback')
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

// fixtures/auth.ts — helper đăng nhập trước mỗi test
```

### `student-register-shift.spec.ts`
```
1. Đăng nhập bằng tài khoản student
2. Vào /student/shifts
3. Click vào 1 shift open
4. Click "Đăng ký"
5. Kiểm tra toast thành công
6. Kiểm tra badge "Chờ duyệt" xuất hiện
7. Kiểm tra shift xuất hiện trong calendar
```

### `student-checkin.spec.ts`
```
1. Đăng nhập bằng student (có shift được approve, đang trong giờ)
2. Vào /student/attendance
3. Nút "CHECK IN" hiển thị
4. Click Check In
5. Status hiển thị "Đúng giờ"
6. Nút chuyển thành "CHECK OUT"
7. Click Check Out
8. hours_worked hiển thị trong lịch sử
```

### `employer-approve-shift.spec.ts`
```
1. Đăng nhập employer
2. Tạo job mới
3. Tạo shift mới cho job đó
4. Đăng nhập student (tab mới), đăng ký vào shift
5. Quay lại employer → vào shift detail
6. Thấy student trong danh sách pending
7. Click "Duyệt"
8. Status chuyển thành "Đã duyệt"
9. Kiểm tra student nhận thông báo (tab student)
```

### `employer-payroll.spec.ts`
```
1. Đăng nhập employer
2. Vào /employer/payroll
3. Click "Tính lương" cho kỳ tháng hiện tại
4. Bảng lương hiển thị đúng nhân viên và số tiền
5. Click "Xuất PDF"
6. File PDF được tải xuống
```

---

## 6. Test Data / Seed Strategy

### Tài khoản test cố định
```
admin@test.com / Admin123!           → role: admin
employer1@test.com / Employer123!    → role: employer, company: "Quán Cà Phê ABC"
student1@test.com / Student123!      → role: student, reputation: 120
student2@test.com / Student123!      → role: student, reputation: 80
```

### Seed data bao gồm
- 1 employer với 2 jobs active
- 5 shifts: 2 open, 1 full, 1 completed, 1 cancelled
- 3 shift registrations: 1 approved, 1 pending, 1 rejected
- 2 attendance records: 1 on_time, 1 late
- 1 payroll record với 2 payroll_items

### Chạy seed
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
| E2E happy paths | 100% của 4 flows trên |
