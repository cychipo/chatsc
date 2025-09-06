# Research — Mã hoá ngược qua nhân Linux từ xa

## Decision 1: Backend là điểm duy nhất gọi luồng xử lý từ xa cho cả ghi và đọc tin nhắn

**Decision**: Chỉ backend được phép gọi luồng xử lý từ xa để mã hoá ngược trước khi lưu và khôi phục nội dung trước khi trả dữ liệu cho giao diện.

**Rationale**: Backend hiện đang sở hữu luồng gửi tin nhắn, truy vấn tin nhắn và phát sự kiện realtime. Đặt toàn bộ xử lý tại đây giúp dữ liệu lưu trữ, REST response và realtime event nhất quán, đồng thời tránh để frontend biết chi tiết xử lý nội dung nhạy cảm.

**Alternatives considered**:
- Để frontend tự giải mã trước khi hiển thị: bị loại vì làm lộ logic xử lý ra client và khó đảm bảo mọi luồng hiển thị nhất quán.
- Chỉ mã hoá ở lúc ghi và giữ nguyên ciphertext khi đọc: bị loại vì không đáp ứng yêu cầu người dùng cuối phải đọc được nội dung bình thường.

## Decision 2: Lưu metadata để phân biệt dữ liệu đã qua mã hoá ngược với dữ liệu cũ

**Decision**: Bản ghi tin nhắn cần có metadata cho biết dữ liệu đã qua cơ chế mã hoá ngược hay chưa, cùng với trạng thái khôi phục gần nhất khi cần.

**Rationale**: Kho dữ liệu hiện tại đã tồn tại trước feature này và đang lưu `content` trực tiếp. Nếu không có metadata, backend không thể biết tin nhắn nào cần khôi phục trước khi trả ra giao diện, và cũng khó xử lý an toàn cho dữ liệu lịch sử chưa qua cơ chế mới.

**Alternatives considered**:
- Suy luận trạng thái dựa trên hình dạng chuỗi nội dung: bị loại vì dễ sai và không đáng tin cậy.
- Bắt buộc migrate toàn bộ dữ liệu cũ ngay lập tức: bị loại vì tăng phạm vi feature vượt quá yêu cầu hiện tại.

## Decision 3: Không fallback thầm lặng khi dịch vụ xử lý từ xa lỗi

**Decision**: Khi backend không thể mã hoá ngược trước lúc lưu hoặc không thể khôi phục trước lúc trả dữ liệu, hệ thống phải trả lỗi rõ ràng hoặc đánh dấu lỗi hiển thị thay vì âm thầm trả dữ liệu sai trạng thái.

**Rationale**: Spec yêu cầu không được bỏ qua cơ chế này một cách im lặng. Fallback sang lưu plaintext hoặc trả ciphertext ra giao diện sẽ làm sai mục tiêu bảo vệ dữ liệu và gây hành vi khó đoán.

**Alternatives considered**:
- Fallback lưu plaintext khi VPS không phản hồi: bị loại vì làm phá vỡ cam kết lưu dữ liệu ở dạng đã biến đổi.
- Trả ciphertext nguyên trạng về FE khi khôi phục lỗi: bị loại vì người dùng cuối sẽ thấy nội dung không đọc được.

## Decision 4: Preview và payload realtime phải dùng nội dung đã khôi phục

**Decision**: Các trường hiển thị như danh sách hội thoại, preview tin nhắn cuối và payload realtime phải sử dụng nội dung đã khôi phục thay vì nội dung đã lưu.

**Rationale**: Hiện tại `lastMessagePreview`, REST message list và socket event đều lấy trực tiếp từ `content`. Nếu không đưa việc khôi phục vào cả ba nơi, giao diện sẽ hiển thị lẫn lộn giữa plaintext và ciphertext.

**Alternatives considered**:
- Chỉ khôi phục ở màn hình chi tiết: bị loại vì preview danh sách hội thoại vẫn sai.
- Chỉ khôi phục ở REST mà bỏ qua socket: bị loại vì tin nhắn mới nhận theo thời gian thực sẽ hiển thị không nhất quán.

## Decision 5: Cấu hình mẫu cần xuất hiện ở cả backend và frontend, nhưng chỉ backend giữ bí mật thực sự

**Implementation update**: Backend hiện validate host, port, timeout và shared key ngay khi bật feature; frontend chỉ giữ cờ công khai `VITE_CHAT_REVERSE_ENCRYPTION_ENABLED`.

**Decision**: Backend phải có đầy đủ khóa cấu hình để bật/tắt luồng xử lý, định nghĩa điểm kết nối và mô tả các giá trị bí mật liên quan. Frontend chỉ cần khóa cấu hình phục vụ hành vi hiển thị hoặc cờ tính năng nếu cần, không chứa bí mật vận hành.

**Rationale**: Người dùng yêu cầu tạo các key trong env example. Theo phân tách trách nhiệm hiện tại, backend mới là nơi gọi dịch vụ xử lý và cần giữ bí mật. Frontend chỉ nên biết các cờ hiển thị cần thiết.

**Alternatives considered**:
- Đặt cùng một bộ khóa bí mật ở frontend: bị loại vì không an toàn và không cần thiết.
- Không thêm gì ở frontend: có thể chấp nhận nếu không có cờ hiển thị, nhưng plan vẫn chừa chỗ để quyết định có cần khóa công khai hay không trong quá trình triển khai.
