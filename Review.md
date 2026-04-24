# Báo cáo Code Review: Module Shifts & Hệ thống Error Handling

**Dự án:** Smart Workforce Platform
**Ngày thực hiện:** 24/04/2026
**Người thực hiện:** Antigravity (AI Assistant)

---

## 1. Hệ thống Xử lý Lỗi (Error Handling)

### Quan sát hiện tại
- **Controller:** Đang lặp lại quá nhiều logic `try-catch` để chuyển đổi các chuỗi lỗi (error strings) từ Service thành `AppError`.
- **Service:** Đang ném các lỗi dạng chuỗi như `throw new Error('SHIFT_NOT_FOUND')`.

### Đánh giá
Việc này gây ra sự lặp lại code không cần thiết ở lớp Controller (Boilerplate code).

### Đề xuất
1. **Dịch chuyển logic:** Service nên ném trực tiếp `AppError` kèm theo status code và message cụ thể.
2. **Gọn nhẹ Controller:** Loại bỏ các block `try-catch` lặp lại, chỉ sử dụng `asyncHandler` để bắt lỗi tự động.
3. **Mở rộng Global Handler:** Cập nhật `app.ts` để xử lý các thuộc tính mở rộng của `AppError`.

---

## 2. Tính đúng đắn & Race Conditions

### Điểm mạnh (Cần phát huy)
- **Cơ chế Atomic Update:** Trong `reviewRegistration`, việc sử dụng câu lệnh `UPDATE` kèm điều kiện `WHERE current_workers < max_workers` là cách xử lý Race Condition rất tốt và an toàn.

### Điểm cần cải thiện
- **Logic `auto_assign`:** Hiện tại cột `auto_assign` đã tồn tại nhưng chưa có logic thực thi. Cần bổ sung logic tự động duyệt đơn đăng ký ngay khi sinh viên click "Register" nếu ca làm có thuộc tính này.
- **Kiểm tra trạng thái trước khi Đăng ký:** Nên ngăn chặn sinh viên đăng ký vào các ca làm việc đã có trạng thái `full` ngay từ lớp Service để tránh các thao tác database không cần thiết.

---

## 3. Hiệu năng & Tối ưu hóa Database

### Tối ưu hóa JOIN
- **Vấn đề:** Method `getShift` đang thực hiện 2 câu lệnh SQL riêng biệt để lấy thông tin ca làm và profile sinh viên.
- **Giải pháp:** Sử dụng `LEFT JOIN` bảng `student_profiles` ngay trong truy vấn chính để tối ưu hóa performance (giảm round-trip tới DB).

### Quản lý Thời gian (Timezone)
- Việc tính toán `hoursUntilStart` dựa trên `Date.now()` của Server có thể bị lệch nếu Server và Database không đồng bộ múi giờ (UTC). Cần đảm bảo tính đồng nhất khi lưu trữ và so sánh.

---

## 4. Bảo mật & Validation

### Validation với Zod
- Cần bổ sung kiểm tra nghiêm ngặt hơn cho method `update`. Hiện tại logic `refine` trong schema có thể bị bỏ qua nếu chỉ cập nhật 1 trong 2 trường `start_time` hoặc `end_time`.

---

## 5. TypeScript & Code Quality

- **Type Safety:** Hạn chế sử dụng `err: any` trong các block catch. Nên sử dụng `err: unknown` và ép kiểu an toàn.
- **Clean Code:** Các truy vấn SQL dài nên được tách ra thành các hằng số hoặc sử dụng Query Builder để dễ bảo trì hơn.

---
**Ghi chú:** Đây là báo cáo sơ bộ. Nếu bạn đồng ý với các đề xuất trên, tôi có thể bắt đầu hỗ trợ refactor từng phần.
