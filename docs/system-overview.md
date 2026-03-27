# System Overview
## Smart Workforce Platform

## Role

**Persona**: Technical Lead (Multi-Role Coordinator)
**Primary Focus**: Cross-cutting concerns, inter-layer contracts, architectural decisions, và dependency map giữa tất cả docs files.
**Perspective**: Đây là điểm vào để hiểu toàn bộ hệ thống. Technical Lead nhận thức đồng thời tất cả roles: khi nghĩ về DB schema change, thấy ngay API contract, TypeScript types, test assertions, và deployment implications. Khi làm bất kỳ feature nào, bắt đầu tại đây để hiểu file nào bị ảnh hưởng trước khi mở chúng.

### How to Use This Document
1. Xác định feature hoặc thay đổi đang implement.
2. Tìm nó trong **Feature Impact Matrix** bên dưới.
3. Mở đúng những files được liệt kê trong row đó — theo thứ tự được liệt kê.
4. Áp dụng role định nghĩa ở đầu mỗi file khi làm việc trong đó.
5. Quay lại đây để xác minh đã xử lý tất cả cross-cutting concerns trước khi đóng công việc.

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
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite, served via nginx trên production
- Backend: Node.js + Express + TypeScript, raw `pg` (no ORM), Socket.io cho realtime
- Database: PostgreSQL 15
- Auth: JWT (Bearer token), 7-day expiry, role encoded trong payload
- Realtime: Socket.io rooms per user (`user_<id>`) và per shift (`shift_<id>`)
- Background Jobs: node-cron (payroll calc hàng ngày, reminders mỗi 30 phút, auto-assign on trigger)
- Infrastructure: Docker Compose (dev + prod), GitHub Actions CI/CD

**Ba application roles** (khác với document roles ở trên):
- `student` — đăng ký ca, check-in/out, xem lương, nhận notifications
- `employer` — tạo jobs và shifts, duyệt đăng ký, quản lý chấm công, chạy payroll
- `admin` — quản lý user toàn platform và statistics; không tương tác với shift/payroll data

---

## 2. The Four Contracts

Đây là 4 ranh giới mà các layer khác nhau của hệ thống phải đồng thuận. Bất kỳ thay đổi nào vượt qua ranh giới đều yêu cầu cập nhật cả hai phía.

### Contract A: DB Schema ↔ API Response Shape
**Owner files**: `docs/01-system-design.md` (phía trái), `docs/03-backend.md` (phía phải)

Mỗi column trong DB schema mà service query trả về tạo ra nghĩa vụ cho API response body. TypeScript types của frontend được derive từ các response bodies này.

**Enum binding quan trọng** — những enum này xuất hiện xuyên suốt toàn stack:
- `users.role` (`student`, `employer`, `admin`): JWT payload → `req.user.role` → roleGuard → `useAuthStore` → `RoleRoute` props → Badge rendering
- `shift_registrations.status` (`pending`, `approved`, `rejected`, `cancelled`): DB → API response → `ShiftEvent.tsx` color mapping → `Badge.tsx` variants → test assertions
- `attendance.status` (`on_time`, `late`, `absent`, `pending`): DB → attendance service → `Badge.tsx` → `AttendanceRow.tsx` → test assertions
- `payroll.status` (`draft`, `confirmed`, `paid`): DB → payroll service → employer payroll UI → E2E test assertions

**Quy tắc**: Khi thêm hoặc đổi tên enum value, cập nhật: `01-system-design.md` (schema + data flow), `03-backend.md` (Zod schema + service query), `04-frontend.md` (Badge.tsx color map + TypeScript type), `05-testing.md` (test cases assert status values cụ thể).

### Contract B: API Endpoint ↔ Frontend API Module
**Owner files**: `docs/03-backend.md` (phía trái), `docs/04-frontend.md` §8 (phía phải)

Mỗi endpoint trong `03-backend.md` có function counterpart trực tiếp trong một `frontend/src/api/*.ts` module. Request body shape và response body shape là binding contract.

**Binding quan trọng**:
- `POST /api/auth/register` → response trả về `token` và `user` — `useAuthStore.login()` destructure đúng 2 fields đó
- `POST /api/shifts/:id/register` → trả về `{ registration: { id, status, ... } }` — `useShiftStore.registerShift()` dùng để update `myRegistrations`
- `POST /api/attendance/checkin` → trả về `{ attendance: { status, late_minutes, check_in_time } }` — `CheckInButton.tsx` display trực tiếp
- Error shape luôn là `{ error: "ERROR_CODE", message: "..." }` — `apiClient.ts` interceptor xử lý shape này cho user-facing toasts

**Quy tắc**: Khi thay đổi request body field (đổi tên, thêm required field, đổi type), cập nhật cả `03-backend.md` (Zod schema + endpoint spec) VÀ `04-frontend.md` (API function signature + form gọi nó). Không bao giờ chỉ thay đổi một phía.

### Contract C: Socket.io Event ↔ Frontend Socket Hook
**Owner files**: `docs/01-system-design.md` §5 (event map authority), `docs/03-backend.md` §4 (emission site), `docs/04-frontend.md` §6 (consumption site)

Đây là three-file contract. Event map trong `01-system-design.md` là nguồn sự thật duy nhất cho tên event và payload structures.

**Event chain hiện tại**:
| Event | Emitted by (backend) | Consumed by (frontend hook) | Store update |
|-------|---------------------|-----------------------------|--------------|
| `notification:new` | Bất kỳ service nào gọi `notifyUser()` | `useNotificationSocket.ts` | `addNotification()` trong `useNotificationStore` |
| `attendance:update` | `attendance.service.ts` khi checkin | `useAttendanceSocket.ts` | `updateAttendanceRecord()` trong attendance store |
| `shift:registered` | `shift.service.ts` khi student đăng ký | Employer's `useSocket.ts` trong shift room | Refresh danh sách đăng ký |
| `shift:approved` | `shift.service.ts` khi employer duyệt | `useNotificationSocket.ts` | Trigger notification + badge update |
| `payroll:updated` | `autoCalcPayroll.ts` background job | `useNotificationSocket.ts` | Trigger notification |
| `shift:reminder` | `sendReminders.ts` background job | `useNotificationSocket.ts` | Trigger notification + toast |

**Quy tắc**: Thêm socket event mới yêu cầu cập nhật cả 3 files theo thứ tự: (1) thêm vào event map trong `01-system-design.md` §5, (2) thêm emission trong `03-backend.md` §4, (3) thêm `socket.on()` trong `04-frontend.md` §6.

### Contract D: Business Rule ↔ Test Assertion
**Owner files**: `docs/01-system-design.md` §6-7 (rule source), `docs/03-backend.md` §6 (implementation), `docs/05-testing.md` §2-3 (assertion)

Business rules có numeric constants (delta values, percentages, time thresholds) được encode ở ba nơi đồng thời.

**Constant bindings quan trọng**:
| Constant | Defined in | Implemented in | Tested in |
|----------|-----------|----------------|-----------|
| Bonus = 5% nếu đúng giờ và đủ giờ | `01-system-design.md` §7 | `utils/payrollCalc.ts` | `payrollCalc.test.ts` |
| Penalty = 2% nếu trễ 1–15 phút | `01-system-design.md` §7 | `payrollCalc.ts` | `payrollCalc.test.ts` |
| Penalty = 5% nếu trễ >15 phút | `01-system-design.md` §7 | `payrollCalc.ts` | `payrollCalc.test.ts` |
| Ngưỡng đúng giờ = 5 phút | `03-backend.md` §6 | `attendance.service.ts` | `attendance.test.ts` |
| Reputation: checkin đúng giờ = +2.0 | `01-system-design.md` §6 | `reputationCalc.ts` | `reputationCalc.test.ts` |
| Reputation: vắng = −10.0 | `01-system-design.md` §6 | `reputationCalc.ts` | `reputationCalc.test.ts` |
| Reputation: hủy <24h = −7.0 | `01-system-design.md` §6 | `shift.service.ts` | `shifts.test.ts` |
| Auto-assign bị khóa dưới score 50 | `01-system-design.md` §6 | `autoAssignShift.ts` | integration test |

**Quy tắc**: Thay đổi bất kỳ constant nào trong `01-system-design.md` yêu cầu đồng thời cập nhật implementation trong utility file tương ứng VÀ test assertions trong `05-testing.md`. Ba nơi này phải luôn đồng bộ. PR chỉ thay đổi một mà không thay đổi hai còn lại là PR chưa hoàn chỉnh.

---

## 3. Authentication & Authorization Flow (Cross-Layer)

Đây là concern xuyên suốt nhất trong hệ thống. Bug ở đây phá vỡ cả 3 roles.

```
[User submit login form]
  → frontend: LoginPage → api/auth.ts login() → POST /api/auth/login
  → backend: auth.controller → auth.service → bcrypt.compare → jwt.sign({ id, email, role })
  → response: { token, user: { id, email, role, full_name } }
  → frontend: useAuthStore.login() lưu token vào localStorage key "token" VÀ trong store
  → frontend: axios interceptor trong apiClient.ts đọc localStorage "token" cho tất cả requests tiếp theo

[Protected route access]
  → frontend: ProtectedRoute kiểm tra useAuthStore().token → redirect /login nếu null
  → frontend: RoleRoute kiểm tra useAuthStore().user.role → redirect /unauthorized nếu sai role
  → backend: authMiddleware đọc Authorization: Bearer <token> → jwt.verify → attach req.user
  → backend: roleGuard kiểm tra req.user.role → 403 nếu không trong allowed list

[Token expiry]
  → backend: jwt.verify throw TokenExpiredError → authMiddleware gửi 401
  → frontend: apiClient.ts response interceptor bắt 401 → clear auth store → redirect /login
```

Files phải nhất quán cho flow này hoạt động:
- `docs/03-backend.md` §3 — authMiddleware và roleGuard specification
- `docs/04-frontend.md` §4 — useAuthStore interface và localStorage key names
- `docs/04-frontend.md` §8 — apiClient.ts 401 interceptor behavior
- `docs/04-frontend.md` §9 — ProtectedRoute và RoleRoute implementation

---

## 4. Feature Impact Matrix

Dùng bảng này khi bắt đầu feature mới hoặc thay đổi bất kỳ để nhanh chóng xác định files nào cần cập nhật.

| Feature / Thay đổi | 01-system-design | 02-project-init | 03-backend | 04-frontend | 05-testing | 06-deployment |
|-------------------|:----------------:|:---------------:|:----------:|:-----------:|:----------:|:-------------:|
| Bảng DB mới | **BẮT BUỘC** | **BẮT BUỘC** (migration) | **BẮT BUỘC** | có thể | **BẮT BUỘC** (seed) | kiểm tra (ENV) |
| Cột DB mới | **BẮT BUỘC** | có thể (migration) | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Đổi tên cột DB | **BẮT BUỘC** | migration | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| REST endpoint mới | có thể | — | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Thay đổi request body | — | — | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Thay đổi response body | có thể | — | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Socket.io event mới | **BẮT BUỘC** | — | **BẮT BUỘC** | **BẮT BUỘC** | có thể | — |
| Business rule constant mới | **BẮT BUỘC** | — | **BẮT BUỘC** | có thể | **BẮT BUỘC** | — |
| Enum value mới | **BẮT BUỘC** | — | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| npm dependency mới | — | **BẮT BUỘC** | hoặc frontend | hoặc backend | — | kiểm tra (Docker) |
| Env variable mới | — | **BẮT BUỘC** | **BẮT BUỘC** | hoặc frontend | — | **BẮT BUỘC** |
| Background job mới | có thể | **BẮT BUỘC** (.env) | **BẮT BUỘC** | có thể | có thể | có thể (cron) |
| Migration file mới | **BẮT BUỘC** | **BẮT BUỘC** | — | — | **BẮT BUỘC** (seed) | **BẮT BUỘC** |
| Page/route mới | — | — | kiểm tra (endpoint) | **BẮT BUỘC** | **BẮT BUỘC** (E2E) | — |
| Component mới | — | — | — | **BẮT BUỘC** | **BẮT BUỘC** (unit) | — |
| Zustand store mới | — | — | kiểm tra | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Thay đổi auth/role logic | — | — | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | — |
| Thay đổi Docker/CI | — | kiểm tra | — | — | kiểm tra | **BẮT BUỘC** |

---

## 5. Critical Business Rules (Cross-Layer Summary)

Các rules này được implement trong backend utilities nhưng derive từ system design và được verify bởi tests. Developer chạm vào chúng phải phối hợp trên cả 3 files.

### Shift Conflict Detection
- **Source**: `docs/01-system-design.md` §3.1 và `docs/03-backend.md` §6
- **Implementation**: `backend/src/utils/conflictCheck.ts`
- **Test**: `backend/tests/conflictCheck.test.ts` và `shifts.test.ts` (integration, 409 case)
- **Frontend impact**: `docs/04-frontend.md` §5 (conflict highlight trong calendar) và §7.1 (UX flow step 6)
- **Rule**: Overlapping time windows với status `pending` HOẶC `approved` là conflict. `rejected` và `cancelled` không tính.

### Payroll Calculation
- **Source**: `docs/01-system-design.md` §7 (formula)
- **Implementation**: `backend/src/utils/payrollCalc.ts`
- **Test**: `backend/tests/payrollCalc.test.ts`
- **Trigger**: `autoCalcPayroll.ts` background job (hàng ngày) HOẶC `POST /api/payroll/calculate` (thủ công)
- **Frontend impact**: `docs/04-frontend.md` §3 (`PayrollSummaryCard.tsx` hiển thị base/bonus/penalty breakdown)

### Reputation Score
- **Source**: `docs/01-system-design.md` §6
- **Implementation**: `backend/src/utils/reputationCalc.ts`
- **Test**: `backend/tests/reputationCalc.test.ts`
- **Bounds**: Score clamp vào [0, 200]. Score < 50 chặn auto-assign eligibility.
- **Frontend impact**: ProfilePage hiển thị `reputation_score` từ `student_profiles.reputation_score`

### Late Detection
- **Source**: `docs/03-backend.md` §6 (ngưỡng 5 phút)
- **Implementation**: `attendance.service.ts` khi checkin
- **Test**: `backend/tests/attendance.test.ts` (checkin trễ 10 phút → status=late, late_minutes=10)
- **Lưu ý**: Ngưỡng 5 phút được định nghĩa trong `03-backend.md`, không phải `01-system-design.md`. Đây là constant nghiệp vụ duy nhất chỉ nằm trong backend spec.

---

## 6. Realtime Architecture Summary

Socket.io dùng cho push notifications từ server đến specific users và shift rooms. Không có client-to-server data mutation qua sockets (tất cả mutations đi qua REST).

**Room strategy**:
- `user_<userId>` — mỗi user join room này khi connect; dùng cho personal notifications
- `shift_<shiftId>` — employers join room này để xem realtime attendance cho một shift cụ thể

**Connection lifecycle** (xem `docs/04-frontend.md` §6, `docs/03-backend.md` §4):
1. Frontend connect đến Socket.io server với JWT trong auth header
2. On connect: client emit `join:room` với personal room của mình
3. Employers thêm emit `join:shift` khi xem shift detail page
4. Server emit đến rooms; clients update Zustand stores qua socket hooks
5. On component unmount: socket disconnect (cleanup trong `useSocket.ts`)

---

## 7. Database Migration Safety Rules

5 quy tắc này cross-cutting giữa `docs/01-system-design.md`, `docs/02-project-init.md`, và `docs/06-deployment.md`.

1. **Không bao giờ** edit migration file đã được commit. Thêm migration mới thay thế.
2. Migration files được đánh số theo timestamp; thứ tự trong `02-project-init.md` §9 là sequence chuẩn tắc và phản ánh thứ tự phụ thuộc foreign key.
3. Trên production: **backup database TRƯỚC** khi chạy bất kỳ migration nào.
4. CI pipeline chạy migrations trên clean test database trước khi chạy tests. Migration fail trong CI sẽ fail trên production.
5. Schema changes trong `01-system-design.md` chưa live cho đến khi migration file tương ứng tồn tại VÀ đã được chạy.

---

## 8. How to Add a New Feature (Checklist)

Dùng thứ tự này để tránh inconsistencies khi implement.

**Bước 1 — Design** (bắt đầu tại `docs/01-system-design.md`)
- [ ] Feature này có cần bảng hoặc cột mới không? Cập nhật ERD và data flow sections.
- [ ] Feature này có giới thiệu Socket.io events mới không? Thêm vào event map (§5).
- [ ] Feature này có giới thiệu business rules mới với numeric constants không? Thêm vào §6 hoặc §7.

**Bước 2 — Infrastructure** (`docs/02-project-init.md`)
- [ ] Feature này có cần env vars mới không? Thêm vào bảng `.env.example`.
- [ ] Feature này có cần migration files mới không? Thêm vào danh sách migration với đúng thứ tự timestamp.

**Bước 3 — Backend** (`docs/03-backend.md`)
- [ ] Document mỗi endpoint mới: method, path, role guard, request, response, errors.
- [ ] Document bất kỳ socket events mới nào được emit: tên event, payload, target room.
- [ ] Document bất kỳ background job logic mới hoặc đã sửa nào.
- [ ] Document bất kỳ business rule implementation mới nào.

**Bước 4 — Frontend** (`docs/04-frontend.md`)
- [ ] Thêm routes mới vào route map.
- [ ] Thêm store state/actions mới vào Zustand store interface liên quan.
- [ ] Thêm API module functions cho mỗi endpoint mới.
- [ ] Thêm socket hook logic cho bất kỳ events mới nào.
- [ ] Document UX flow cho user-facing features.

**Bước 5 — Testing** (`docs/05-testing.md`)
- [ ] Thêm unit test cases cho utility functions mới.
- [ ] Thêm integration test cases cho mỗi endpoint mới (happy path + primary error cases).
- [ ] Thêm frontend unit test cases cho components mới.
- [ ] Cập nhật E2E tests nếu happy-path flow thay đổi.
- [ ] Cập nhật seed data nếu cần bảng hoặc test scenarios mới.

**Bước 6 — Deployment** (`docs/06-deployment.md`)
- [ ] Thêm env vars mới vào production ENV checklist.
- [ ] Cập nhật release checklist nếu có migration mới hoặc infrastructure steps mới.

---

## 9. Decisions Log

Ghi lại các quyết định thiết kế đã được xác nhận. Không thay đổi các decisions này mà không có lý do rõ ràng.

| # | Ngày | Vấn đề | Decision | Lý do |
|---|------|--------|----------|-------|
| 1 | 2026-03-27 | User creation flow | Employer tự đăng ký; Student do employer tạo qua `POST /api/employers/employees` | Hệ thống nội bộ — employer quản lý toàn bộ nhân sự của mình |
| 2 | 2026-03-27 | Auto-assign flow | Weekly scheduling job (0:00 thứ Hai), xử lý tất cả pending registrations của tuần | Student chủ động đăng ký ca muốn làm; hệ thống tự động giải quyết conflicts và ưu tiên |
| 3 | 2026-03-27 | Rating/Review | Implement bảng `ratings` + endpoint `POST /api/ratings` + tính vào reputation | Cần thiết cho reputation score có ý nghĩa thực tế |
| 4 | 2026-03-27 | Shift status transitions | Tự động hoàn toàn qua background jobs | Giảm thao tác thủ công cho employer |
| 5 | 2026-03-27 | Payroll total_pay âm | Clamp về 0 — `GREATEST(0, base_pay + bonus - penalty)` | Không có nghĩa kinh doanh khi student nợ lương |
| 6 | 2026-03-27 | Employer hủy ca | Student KHÔNG bị trừ reputation | Student không có lỗi khi employer hủy |
| 7 | 2026-03-27 | Conflict check scope | Chỉ `pending` + `approved` tính conflict; `rejected`/`cancelled` không tính | Student bị reject/cancel phải có thể đăng ký ca khác cùng giờ |
| 8 | 2026-03-27 | Cancel penalty | Hủy ≥24h = 0 điểm; Hủy <24h = -7.0 reputation | Hủy sớm không gây hại cho employer; hủy trễ gây khó khăn cho việc tìm người thay |
| 9 | 2026-03-27 | Deadline đăng ký | **Chủ nhật 12:00 trưa** — scheduler chạy 0:00 thứ Hai chỉ xử lý registrations trước deadline | Cho employer 12 tiếng buổi chiều Chủ nhật để manually fill ca thiếu người |
| 10 | 2026-03-27 | Conflict check | **KHÔNG check conflict khi đăng ký** — student đăng ký nhiều ca trùng giờ được; scheduler giải quyết | UX đơn giản hơn; student không bị block khi muốn thử nhiều ca |
| 11 | 2026-03-27 | Ca ít người | Alert employer lúc 11:00 sáng Chủ nhật nếu ca chưa đủ người | 1 giờ trước deadline để employer kịp assign thủ công |
| 12 | 2026-03-27 | Temp password | Chỉ return trong API response — employer copy cho nhân viên | Không cần email service cho BTL |
| 13 | 2026-03-27 | Timezone | UTC+7 toàn hệ thống — không convert | Hệ thống chỉ dùng ở Việt Nam |
| 14 | 2026-03-27 | Report module | Có biểu đồ với recharts | Employer cần trend visualization |
| 15 | 2026-03-27 | Multi-employer | Student thuộc **1 employer duy nhất** — `employer_id` trong `student_profiles` | Hệ thống nội bộ, không phải marketplace; employer quản lý nhân sự của mình |
| 16 | 2026-03-27 | Payroll accumulation | Real-time: shift hoàn thành → tạo `payroll_item` ngay → cộng dồn → `payroll` tổng kết cuối kỳ | Student thấy lương cập nhật ngay sau mỗi ca; không cần chờ batch hàng ngày |
| 17 | 2026-03-27 | Admin scope | Đầy đủ: stats + lock/unlock + **tạo employer account** + **xem/can thiệp payroll và shifts của bất kỳ employer** | Admin cần toàn quyền để hỗ trợ và giám sát toàn hệ thống |
| 18 | 2026-03-27 | Payroll formula | Deduction model: `total_pay = scheduled_pay - late_deduction - early_deduction`; `attendance` track cả `late_minutes` và `early_minutes`; `payroll_items` lưu breakdown | Trừ tuyến tính theo thời gian thiếu; UI hiển thị được từng khoản trừ; reputation tách biệt hoàn toàn |
| 19 | 2026-03-27 | Payroll period | Calendar month: `period_start = ngày 1`, `period_end = ngày cuối tháng`; auto-create payroll record cho tháng khi tạo payroll_item đầu tiên | Đơn giản, dễ hiểu; phù hợp chu kỳ thanh toán thực tế |
| 20 | 2026-03-27 | Cancel approved registration | `current_workers -= 1` VÀ slot mở lại cho người khác đăng ký | Student hủy thì slot phải được lấp; employer không cần làm gì thêm |
| 21 | 2026-03-27 | No-checkout handling | Status = `incomplete`, `hours_worked = 0`, không tính lương; employer có thể force-checkout từ xa tối đa **3 lần / student / tháng** | Bảo vệ student khỏi mất lương do quên checkout; limit tránh lạm dụng |
| 22 | 2026-03-27 | Admin seeding | Admin account seeded qua `npm run seed`; employer tự đăng ký trên web | BTL scope không cần admin creation flow phức tạp |
