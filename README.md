# AEGI PAR — Submission UI 1.1 trên PAR_CORE rc4

Trạng thái: kiểm thử local hoàn tất; CHƯA triển khai public. GitHub connector trả 403 Resource not accessible by integration khi tạo tree. Không sửa Railway trực tiếp.

## Cập nhật
- Màn hình mở đầu ngắn, tiếng Việt, nút bắt đầu nằm trong màn hình điện thoại.
- Ba tình huống mẫu chạy API thật: PREVENT_VERIFY / VERIFY_LIGHT / RECOVER.
- Reset đầy đủ khi đổi ca; chặn gửi trong lúc tải ảnh; bỏ kết quả tải ảnh cũ khi đổi ca.
- Chỉ báo xóa thành công sau khi API xác nhận; xử lý mất kết nối khi tải nguồn.
- Giữ nguyên backend, chính sách, dữ liệu rc4; UI có version riêng.
- Benchmark thể hiện PAR và B2 đều 40/40, không suy ra vượt baseline hoặc hiệu quả thực tế.
- Nêu rõ ảnh gửi tới máy chủ, chưa OCR; không giả tích hợp ngân hàng/nhà mạng/Công an.

## Triển khai vào repo hiện tại
1. Giải nén gói này. Trong hoangtm3979/aegi-par-demo, kiểm tra main trước khi cập nhật. Base đã đọc: 211a7a3d5da897ff43d2867d8e4087ba8de1c2c1. Nếu có commit mới, kiểm tra khác biệt trước, không ghi đè mù.
2. Thêm thư mục submission_overlay, UI_RELEASE.json và thay Dockerfile bằng bản trong gói. AEGI_PAR_P3_APP_BUNDLE.zip phải giữ hash dưới đây; gói có kèm đúng bytes để tiện kiểm tra. Không giải nén ZIP backend vào repo.
3. Commit cùng một lần. Railway service aegi-par-demo-rc4 tiếp tục build từ repo này bằng Dockerfile. Không đổi biến môi trường.
4. Khi deployment SUCCESS, mở https://aegi-par-demo-rc4-production.up.railway.app/ và xác nhận header UI 1.1. Thử cả ba tình huống, mở nguồn, xóa kết quả; kiểm tra điện thoại. Chưa coi public acceptance hoàn tất chỉ vì build xanh.
5. Nếu lỗi, rollback Railway về deployment trước. Không thay backend để chữa lỗi UI.

Backend ZIP SHA-256: 28ef2504f91ffac2dce6a1e613e56802fe61d011b3b840b0963e8bb675b5d0c0.
Dockerfile giữ nguyên phép chuẩn hóa phiên bản OpenCV vốn đã có trên production; đây không phải thay đổi dependency mới trong UI 1.1.

## Phạm vi kiểm thử
Xem UI_RELEASE.json. Kiểm thử thực tế dùng Python 3.12 local, thư viện chính theo requirements-prod đã chuẩn hóa của deployment; chưa build container Python 3.13 production. 503 và upload chậm là fault injection để test UI, không phải kết quả mô phỏng được đưa ra cho người dùng.
Đây là acceptance giao diện, không phải benchmark mới hoặc bằng chứng chống lừa đảo ngoài thực tế.
