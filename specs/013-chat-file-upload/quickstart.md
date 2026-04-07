# Quickstart: Chat File Upload

## Mục tiêu
Xác minh luồng gửi file trong chat: upload ảnh, upload file, trình xem ảnh với zoom, card file với nút tải về, và các lỗi giới hạn kích thước / thư mục.

## Setup
1. Start backend và frontend với lệnh workspace hiện tại.
2. Đảm bảo đã thêm R2 credentials vào `backend/.env` (nếu chưa có, upload sẽ không hoạt động).
3. Đăng nhập với ít nhất một tài khoản có cuộc trò chuyện direct hoặc group.

## Kịch bản 1: Upload và hiển thị ảnh trong chat
1. Mở một cuộc trò chuyện.
2. Bấm nút đính kèm (icon giấy ghim) trong vùng soạn tin nhắn.
3. Chọn một file ảnh (JPEG, PNG, GIF, WebP) dưới 25MB.
4. Xác nhận trong chat thread hiện ảnh dưới dạng inline preview.
5. Bấm vào ảnh để mở trình xem ảnh.
6. Xác nhận trình xem ảnh có các nút phóng to, thu nhỏ, reset, và tải về.
7. Bấm nút phóng to (zoom in), xác nhận ảnh phóng to.
8. Bấm nút reset, xác nhận ảnh về kích thước ban đầu.
9. Bấm nút tải về, xác nhận ảnh được tải về thiết bị.
10. Đóng trình xem ảnh.

## Kịch bản 2: Upload và hiển thị file không phải ảnh
1. Mở một cuộc trò chuyện.
2. Bấm nút đính kèm trong vùng soạn tin nhắn.
3. Chọn một file không phải ảnh (PDF, DOCX, ZIP) dưới 25MB.
4. Xác nhận trong chat thread hiện card file gồm biểu tượng, tên file, kích thước.
5. Bấm nút tải về trên card file.
6. Xác nhận file được tải về thiết bị.

## Kịch bản 3: Từ chối file vượt quá giới hạn kích thước
1. Mở một cuộc trò chuyện.
2. Bấm nút đính kèm.
3. Chọn một file lớn hơn 25MB.
4. Xác nhận hệ thống hiển thị thông báo lỗi giới hạn kích thước trước khi upload bắt đầu.
5. Xác nhận không có file nào được upload.

## Kịch bản 4: Từ chối thư mục
1. Mở một cuộc trò chuyện.
2. Bấm nút đính kèm.
3. Thử chọn một thư mục (folder).
4. Xác nhận hệ thống hiển thị thông báo lỗi rõ ràng và không có upload nào xảy ra.

## Kịch bản 5: Tải lại file đã chia sẻ
1. Mở cuộc trò chuyện đã có tin nhắn kèm file.
2. Tìm card file hoặc ảnh đã được chia sẻ trước đó.
3. Bấm nút tải về trên card file hoặc trong trình xem ảnh.
4. Xác nhận file được tải về thiết bị.

## Kiểm tra tự động gợi ý
- Frontend test cho validation (size, folder rejection).
- Frontend test cho render image inline vs file card.
- Frontend test cho trình xem ảnh với các điều khiển zoom.
- Backend test hoặc service-level test cho presigned URL generation và attachment metadata persistence.
