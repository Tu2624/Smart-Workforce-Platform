Tôi sắp làm việc với: $ARGUMENTS

Đây là phần nhạy cảm của hệ thống. Hãy:

1. Đọc `docs/system-overview.md` — sections "2. The Four Contracts", "3. Authentication & Authorization Flow", và "5. Critical Business Rules"
2. Xác định "$ARGUMENTS" thuộc loại nào và đọc thêm:
   - **Auth / JWT / Role**: Đọc thêm `docs/03-backend.md` §3 và `docs/04-frontend.md` §4, §8, §9 — kiểm tra auth flow cross-layer
   - **Enum values**: Contract A binding — enum xuất hiện đồng thời ở DB schema, Zod validation, TypeScript type, Badge.tsx color map, test assertions
   - **Socket.io events**: Contract C là three-file contract — bắt buộc update `01-system-design.md` §5, `03-backend.md` §4, `04-frontend.md` §6 cùng lúc
   - **Business rule constants**: Contract D — thay đổi constant phải đồng bộ cả implementation lẫn test assertions ngay lập tức
3. Liệt kê cụ thể những điểm nào cần kiểm tra TRƯỚC khi thực hiện thay đổi
4. Đưa ra cảnh báo nếu thay đổi có thể gây side effects không mong muốn trên các layer khác
