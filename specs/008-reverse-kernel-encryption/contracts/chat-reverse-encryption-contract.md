# Contract — Reverse Encryption for Chat Read/Write Flows

## Mục tiêu

Ràng buộc hành vi của các giao diện chat hiện có khi feature mã hoá ngược được bật, bao gồm REST API lấy lịch sử, socket event gửi tin nhắn realtime và dữ liệu preview hội thoại.

## 1. Contract cho luồng ghi tin nhắn

### Cập nhật thực thi giai đoạn hiện tại
- Luồng gửi tin nhắn phải thất bại rõ ràng nếu bước mã hoá ngược không hoàn tất trước khi lưu.
- Payload realtime trả về sau khi gửi thành công phải chứa nội dung đã khôi phục để phía nhận có thể hiển thị ngay.

### Tác nhân
- Người dùng đã đăng nhập và là thành viên hợp lệ của cuộc trò chuyện.

### Đầu vào nghiệp vụ
- `conversationId`: cuộc trò chuyện đích.
- `content`: nội dung người dùng nhập.

### Cam kết đầu ra
- Hệ thống chỉ ghi dữ liệu tin nhắn sau khi đã đi qua bước mã hoá ngược.
- Dữ liệu lưu trữ không được giữ nguyên plaintext của nội dung người dùng vừa nhập.
- Nếu xử lý thất bại, yêu cầu phải thất bại rõ ràng; không được âm thầm lưu plaintext.

## 2. Contract cho REST API lấy lịch sử tin nhắn

### Áp dụng cho
- Endpoint lấy danh sách tin nhắn của cuộc trò chuyện.

### Cam kết đầu ra
- Trường nội dung trong payload trả về cho frontend phải là nội dung đã khôi phục, sẵn sàng hiển thị.
- Với dữ liệu đã qua mã hoá ngược, frontend không được nhận ciphertext trong luồng hiển thị mặc định.
- Với dữ liệu cũ chưa qua cơ chế này, backend phải áp dụng quy tắc phù hợp theo trạng thái dữ liệu để tránh khôi phục sai.
- Nếu khôi phục thất bại, hệ thống phải trả trạng thái hiển thị lỗi nhất quán cùng mã lỗi để frontend không hiển thị nhầm ciphertext gốc.

## 3. Contract cho preview hội thoại

### Áp dụng cho
- Danh sách hội thoại trả từ API.
- Event cập nhật preview hội thoại theo thời gian thực.

### Cam kết đầu ra
- `lastMessagePreview` phải chứa nội dung đã khôi phục, không phải ciphertext.
- Preview phải nhất quán giữa lần tải đầu bằng HTTP và lần cập nhật sau bằng socket.

## 4. Contract cho socket event tin nhắn thời gian thực

### Áp dụng cho
- Event giao tin nhắn mới trong namespace chat.

### Cam kết đầu ra
- Nội dung trong event phải là nội dung đã khôi phục để frontend có thể hiển thị ngay.
- Event chỉ được phát sau khi bước xử lý lưu trữ hoàn tất thành công.
- Nếu bước mã hoá hoặc khôi phục thất bại, client phải nhận được phản hồi lỗi thay vì nhận một payload chứa ciphertext.

## 5. Contract cho cấu hình mẫu

### Backend
- Tệp cấu hình mẫu phải liệt kê đầy đủ khóa cần thiết để bật feature, chỉ điểm dịch vụ xử lý từ xa, khai báo timeout và các giá trị bí mật hoặc tham chiếu bí mật liên quan.
- Tài liệu cấu hình phải đủ rõ để đội vận hành biết khóa nào là bắt buộc.
- Khi bật feature mà thiếu host, port, timeout hợp lệ hoặc shared key, backend phải fail rõ ngay từ bước nạp cấu hình.

### Frontend
- Nếu cần cờ công khai để bật hành vi giao diện, tệp cấu hình mẫu frontend phải liệt kê rõ khóa tương ứng.
- Frontend không được yêu cầu giữ bí mật vận hành của dịch vụ xử lý.

## 6. Điều kiện chấp nhận liên chức năng

- Luồng REST, socket và preview phải cùng dùng một quy tắc khôi phục nội dung.
- Mọi lỗi do thiếu cấu hình hoặc mất kết nối tới dịch vụ xử lý phải được phân biệt rõ với lỗi người dùng nhập liệu không hợp lệ.
- Feature không được làm thay đổi quyền truy cập hiện có của thành viên cuộc trò chuyện.
