# Quickstart — Mã hoá ngược qua nhân Linux từ xa

## Mục tiêu

Xác minh rằng tin nhắn mới được mã hoá ngược trước khi lưu, dữ liệu đọc ra được khôi phục trước khi trả về giao diện, và cấu hình mẫu đã đủ để bật tính năng ở môi trường mới.

## Điều kiện tiên quyết

- Backend, frontend và cơ sở dữ liệu của hệ thống chat đang chạy được.
- Dịch vụ xử lý từ xa trên môi trường Linux đã được triển khai và có thể truy cập từ backend.
- Môi trường backend đã được điền các giá trị cấu hình thật tương ứng với các khóa mới trong tệp cấu hình mẫu.
- Nếu frontend cần cờ hiển thị, các khóa công khai tương ứng đã được điền trong tệp cấu hình thật của frontend.

## Chuẩn bị cấu hình

1. Cập nhật tệp cấu hình mẫu của backend với các khóa cần thiết để bật mã hoá ngược và kết nối tới dịch vụ xử lý từ xa.
2. Cập nhật tệp cấu hình mẫu của frontend với các khóa công khai nếu giao diện cần hiển thị trạng thái hoặc điều kiện liên quan đến feature.
3. Điền giá trị thật vào các tệp môi trường triển khai tương ứng.
4. Khởi động lại backend và frontend sau khi cập nhật cấu hình.

## Luồng kiểm thử chính

### 1. Kiểm tra lưu trữ dưới dạng đã mã hoá ngược

> Sau khi gửi tin nhắn thành công, kiểm tra DB phải thấy `content` khác plaintext gốc và trạng thái xử lý phản ánh dữ liệu đã đi qua luồng mã hoá ngược.

1. Đăng nhập bằng hai tài khoản hợp lệ.
2. Tạo hoặc mở một cuộc trò chuyện trực tiếp hay nhóm.
3. Gửi một tin nhắn mới.
4. Kiểm tra bản ghi tin nhắn trong nơi lưu trữ.
5. Xác nhận trường lưu nội dung không trùng với văn bản đã nhập ban đầu.
6. Xác nhận bản ghi mang trạng thái cho biết đã qua luồng mã hoá ngược.

### 2. Kiểm tra đọc lại lịch sử ở dạng hiển thị được

> Nếu khôi phục thất bại, giao diện phải nhận trạng thái lỗi hiển thị thay vì ciphertext gốc.

1. Tải lại danh sách tin nhắn của cuộc trò chuyện vừa gửi.
2. Xác nhận nội dung trả về từ backend khớp với nội dung gốc người dùng đã nhập.
3. Xác nhận preview ở danh sách hội thoại cũng hiển thị nội dung dễ đọc thay vì ciphertext.

### 3. Kiểm tra luồng realtime

1. Mở cùng cuộc trò chuyện ở một phiên người nhận khác.
2. Gửi một tin nhắn mới từ người gửi.
3. Xác nhận người nhận thấy nội dung dễ đọc ngay khi nhận realtime event.
4. Xác nhận danh sách hội thoại của cả hai phía cập nhật preview bằng nội dung đã khôi phục.

### 4. Kiểm tra dữ liệu cũ

1. Dùng một cuộc trò chuyện đã có sẵn dữ liệu từ trước khi bật feature.
2. Tải lịch sử hội thoại.
3. Xác nhận hệ thống không áp sai quy tắc khôi phục lên dữ liệu cũ nếu dữ liệu đó chưa thuộc cơ chế mã hoá ngược.

### 5. Kiểm tra lỗi cấu hình và lỗi xử lý

> Bật feature với host/port/shared key/timeout không hợp lệ phải làm backend báo lỗi cấu hình rõ ràng; khi mất kết nối processor trong lúc chạy, các request chat mới phải fail rõ ràng thay vì lưu plaintext.

1. Tạm thời bỏ một khóa cấu hình bắt buộc hoặc làm dịch vụ xử lý từ xa không thể truy cập.
2. Thử gửi một tin nhắn mới.
3. Xác nhận hệ thống trả lỗi rõ ràng và không lưu plaintext ngoài ý muốn.
4. Khôi phục cấu hình đúng rồi kiểm tra lại để xác nhận hệ thống quay về hoạt động bình thường.

## Kết quả mong đợi

- Tin nhắn mới được lưu ở dạng đã biến đổi.
- Người dùng cuối chỉ thấy nội dung đã khôi phục ở các màn hình chat thông thường.
- Preview hội thoại và realtime event nhất quán với nội dung hiển thị trong lịch sử chat.
- Dữ liệu cũ không bị xử lý sai do thiếu trạng thái nhận diện.
- Tệp cấu hình mẫu đủ rõ để đội vận hành biết cần điền giá trị nào ở môi trường thật.
