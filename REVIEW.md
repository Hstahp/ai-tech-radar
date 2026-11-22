# Quy định Code Review (REVIEW.md)

## 1. Phân loại mức độ lỗi

Khi phát hiện vấn đề, đánh nhãn rõ ràng:

- **Important**: Lỗi bắt buộc phải sửa trước khi merge.
- **Nit**: Góp ý nhỏ, không bắt buộc.
- **Pre-existing**: Lỗi đã tồn tại từ trước trong hệ thống, không yêu cầu người làm PR sửa.

## 2. Danh mục kiểm tra dựa trên Diff (Diff-triggered Checklist)

AI chỉ đọc diff và chạy các mục kiểm tra có trigger tương ứng:

- **Nếu sửa Database/Session/Dữ liệu**: Kiểm tra tính tương thích ngược (Backward compatibility) xem phiên bản cũ có đọc được dữ liệu không.
- **Nếu sửa Thuật toán/Logic biến đổi**: Viết Property test (dùng fast-check / Hypothesis) để kiểm tra các trường hợp biên và tính bất biến.
- **Nếu Di trú/Refactor hệ thống cũ sang mới**: Chạy Differential test (cho cả 2 hệ thống nhận cùng đầu vào để so sánh).

## 3. Cải tiến quy tắc

Khi có lỗi bị bỏ sót từ thực tế hoặc PR bị revert, bổ sung thêm quy tắc kiểm tra mới vào file này để không lặp lại lỗi.
