Tôi sắp implement feature: $ARGUMENTS

Hãy thực hiện các bước sau:

1. Đọc `docs/system-overview.md` — tập trung vào section "4. Feature Impact Matrix" và "8. How to Add a New Feature (Checklist)"
2. Dựa vào tên feature "$ARGUMENTS", xác định:
   - Loại thay đổi nào sẽ xảy ra (bảng DB mới? endpoint mới? component mới? socket event mới?...)
   - Đánh dấu những files nào là BẮT BUỘC cập nhật theo Feature Impact Matrix
3. Đọc các docs files liên quan để hiểu rõ context hiện tại của phần sẽ implement
4. Tạo checklist 6 bước cụ thể cho feature này (Design → Infrastructure → Backend → Frontend → Testing → Deployment), chỉ giữ lại những bước thực sự cần thiết, bỏ qua bước không áp dụng
5. Chỉ ra ngay các cross-cutting contracts nào (A/B/C/D) sẽ bị ảnh hưởng và điểm cần chú ý cụ thể
