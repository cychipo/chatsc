# Quickstart: Hệ thống chat Socket với Linux Kernel Module

## Mục tiêu

Dựng nhanh môi trường demo cho luồng:

`Client -> /dev/device -> Driver -> Client`

và xác nhận tích hợp chat qua socket trên host Ubuntu/Linux.

## Điều kiện đầu vào

- Có Ubuntu host hoặc VPS Ubuntu.
- Có source code dự án.
- Có feature artifacts trong thư mục `specs/001-socket-chat-kmod/`.
- Có `linux-headers-$(uname -r)` khớp với kernel đang chạy.

## Luồng thực hiện đề xuất

1. Cài công cụ build trên host Ubuntu.
2. Build client và server trực tiếp trên host.
3. Build driver thành module sẵn sàng nạp vào host kernel.
4. Nạp driver với quyền root phù hợp.
5. Xác nhận driver đã sẵn sàng và device node đã xuất hiện.
6. Khởi động server chat trên host.
7. Khởi động client và gửi message thử nghiệm.
8. Xác nhận client nhận lại kết quả đã đi qua driver.
9. Kiểm tra log cho các mốc load, open, write, read, close và unload.
10. Gỡ driver an toàn sau khi kết thúc phiên demo.

## Bộ kiểm thử smoke đề xuất

### Smoke 1: Môi trường build
- Xác nhận host có đủ build tools.
- Hoàn tất một lần build ứng dụng.
- Hoàn tất một lần build module.

### Smoke 2: Module lifecycle
- Nạp driver.
- Xác nhận trạng thái sẵn sàng của driver.
- Xác nhận device node khả dụng.
- Gỡ driver khi không còn client sử dụng.

### Smoke 3: Device processing
- Gửi một message mẫu theo chế độ substitution.
- Xác nhận kết quả trả về đúng kỳ vọng.
- Gửi lại cùng message và kiểm tra tính nhất quán.
- Lặp lại với chế độ SHA1.

### Smoke 4: End-to-end chat
- Khởi động server.
- Kết nối client đến server.
- Gửi message chat.
- Xác nhận message hoặc phản hồi ở client phản ánh kết quả sau bước xử lý bởi driver.

## Kết quả mong đợi

- Môi trường phát triển dựng được trực tiếp trên host Ubuntu/VPS.
- Driver có thể được nạp và gỡ theo quy trình kiểm soát trên host kernel.
- Device node là điểm giao tiếp ổn định giữa client và driver.
- Luồng chat đầu-cuối được demo thành công.
- Log đủ để chẩn đoán các lỗi tích hợp phổ biến.

## Hướng dẫn xử lý lỗi ở mức kiểm thử

- Nếu device không truy cập được: kiểm tra trạng thái nạp driver và quyền truy cập device.
- Nếu driver không nạp được: kiểm tra sự tương thích giữa module build và kernel đích.
- Nếu socket chat thất bại: tách kiểm thử thành hai phần, xác nhận device loop trước rồi mới xác nhận network flow.
- Nếu gỡ driver thất bại: kiểm tra còn client hoặc tiến trình nào đang giữ device mở hay không.
