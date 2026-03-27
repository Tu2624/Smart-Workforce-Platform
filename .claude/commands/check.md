Hãy kiểm tra tính nhất quán cross-layer của công việc vừa thực hiện.

Thực hiện theo thứ tự:

1. Đọc `docs/system-overview.md` — section "2. The Four Contracts" và "4. Feature Impact Matrix"
2. Với mỗi Contract (A, B, C, D), kiểm tra:
   - **Contract A** (DB Schema ↔ API Response): Có cột DB nào mới/đổi mà API response shape chưa phản ánh không?
   - **Contract B** (API Endpoint ↔ Frontend API Module): Có endpoint nào mới/đổi mà `frontend/src/api/*.ts` chưa cập nhật không?
   - **Contract C** (Socket.io Event ↔ Frontend Hook): Có event nào mới/đổi mà frontend socket hook chưa lắng nghe không?
   - **Contract D** (Business Rule ↔ Test Assertion): Có constant nào thay đổi mà test assertions chưa cập nhật không?
3. Kiểm tra Feature Impact Matrix — với những thay đổi đã làm, có file nào đánh dấu BẮT BUỘC nhưng chưa được cập nhật không?
4. Đưa ra danh sách kết quả rõ ràng:
   - ✅ đã đồng bộ
   - ⚠️ cần kiểm tra thêm (nêu lý do)
   - ❌ đang vi phạm contract (nêu cụ thể cần làm gì)

$ARGUMENTS
