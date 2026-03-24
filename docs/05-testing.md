# 05 — Testing Specification
## Smart Workforce Platform

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
  it('tính đúng base pay theo giờ làm')
  it('cộng bonus 5% nếu đúng giờ và đủ ca')
  it('trừ penalty 2% nếu trễ 1–15 phút')
  it('trừ penalty 5% nếu trễ > 15 phút')
  it('không cộng bonus nếu đi trễ')
  it('không cho hours_worked > shift duration')
})
```

### `conflictCheck.test.ts`
```typescript
describe('hasShiftConflict', () => {
  it('không conflict nếu ca mới bắt đầu sau khi ca cũ kết thúc')
  it('không conflict nếu ca mới kết thúc trước khi ca cũ bắt đầu')
  it('conflict nếu ca mới overlap hoàn toàn với ca cũ')
  it('conflict nếu ca mới bắt đầu trong lúc ca cũ đang diễn ra')
  it('không conflict với ca đã bị rejected/cancelled')
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
```

### `payroll.test.ts`
```typescript
describe('POST /api/payroll/calculate', () => {
  it('200 — tính đúng tổng lương cho nhiều ca trong kỳ')
  it('200 — bao gồm bonus và penalty')
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
it('hiển thị bonus với màu xanh')
it('hiển thị penalty với màu đỏ')
it('tính đúng total = base + bonus - penalty')
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
