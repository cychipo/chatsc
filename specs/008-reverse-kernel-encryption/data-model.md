# Data Model — Mã hoá ngược qua nhân Linux từ xa

## 1. Tin nhắn trò chuyện

### Mô tả
Đại diện cho một tin nhắn thuộc một cuộc trò chuyện. Đây là thực thể chịu tác động lớn nhất của feature vì nội dung lưu trữ và nội dung hiển thị không còn là cùng một giá trị.

### Thuộc tính chính
- `id`: định danh duy nhất của tin nhắn.
- `conversationId`: liên kết tới cuộc trò chuyện chứa tin nhắn.
- `senderId`: định danh người gửi.
- `storedContent`: nội dung đã được mã hoá ngược để lưu trữ.
- `displayContent`: nội dung đã được khôi phục để trả về giao diện; là trường dẫn xuất, không phải nguồn dữ liệu lưu trữ chính.
- `displayState`: trạng thái hiển thị cho biết tin nhắn đang ở trạng thái bình thường hay khôi phục lỗi.
- `sentAt`: thời điểm gửi.
- `deliveryStatus`: trạng thái gửi hiện tại.
- `reverseEncryptionState`: trạng thái cho biết tin nhắn thuộc dữ liệu cũ hay dữ liệu đã qua luồng mã hoá ngược.
- `decodeErrorCode`: mã lỗi khôi phục gần nhất nếu có.

### Validation rules
- Không cho phép tạo tin nhắn mới với `storedContent` rỗng sau bước chuẩn hoá nội dung.
- Tin nhắn mới thuộc phạm vi feature phải có `reverseEncryptionState` thể hiện đã mã hoá trước khi lưu.
- Nếu khôi phục thất bại, hệ thống phải giữ được dấu vết lỗi để phục vụ điều tra vận hành.

### Trạng thái khả dĩ
- `legacy`: dữ liệu cũ chưa qua mã hoá ngược.
- `encrypted`: dữ liệu đã được mã hoá ngược và sẵn sàng để khôi phục khi đọc.
- `decode_failed`: dữ liệu lẽ ra phải khôi phục nhưng lần đọc gần nhất thất bại.

### Chuyển trạng thái
- Tin nhắn cũ có thể giữ ở `legacy` cho tới khi có chiến lược chuyển đổi riêng.
- Tin nhắn mới đi qua luồng gửi thành công sẽ vào `encrypted`.
- Tin nhắn `encrypted` nếu khôi phục thất bại trong lúc đọc sẽ được đánh dấu `decode_failed` cùng thông tin lỗi phù hợp.

## 2. Bản ghi xem trước hội thoại

### Mô tả
Đại diện cho thông tin rút gọn hiển thị ở danh sách hội thoại, đặc biệt là tin nhắn gần nhất.

### Thuộc tính chính
- `conversationId`: định danh cuộc trò chuyện.
- `lastMessagePreview`: nội dung cuối cùng đã được khôi phục để có thể hiển thị.
- `lastMessageAt`: thời điểm tin nhắn cuối cùng.
- `previewState`: trạng thái cho biết preview được sinh từ dữ liệu đã khôi phục hay đang lỗi.

### Validation rules
- Không được lấy trực tiếp ciphertext từ kho lưu trữ để hiển thị ở preview mặc định.
- Nếu preview không thể khôi phục, phải có trạng thái tương ứng thay vì hiển thị nhầm ciphertext.

## 3. Cấu hình mã hoá ngược

### Mô tả
Đại diện cho tập giá trị cấu hình cần thiết để bật tính năng, kết nối tới dịch vụ xử lý từ xa và cung cấp các giá trị bí mật liên quan.

### Thuộc tính chính
- `featureEnabled`: bật hoặc tắt cơ chế mã hoá ngược.
- `processorHost`: địa chỉ dịch vụ xử lý từ xa.
- `processorPort`: cổng dịch vụ xử lý từ xa.
- `processingMode`: chế độ xử lý được áp dụng cho feature này.
- `sharedSecretOrKeyRef`: tham chiếu tới giá trị bí mật hoặc khóa nếu luồng triển khai yêu cầu.
- `requestTimeout`: giới hạn chờ cho một lần xử lý.
- `publicUiFlag`: cờ cấu hình công khai cho frontend nếu cần thể hiện trạng thái tính năng.

### Validation rules
- Các giá trị bắt buộc phải được khai báo ở tệp cấu hình mẫu.
- Nếu bật feature mà thiếu giá trị bắt buộc, hệ thống phải fail rõ ràng.
- Giá trị bí mật hoặc tham chiếu bí mật không được yêu cầu ở frontend trừ khi chỉ là cờ công khai không nhạy cảm.

## 4. Kết quả hiển thị tin nhắn

### Mô tả
Đại diện cho payload trả về từ backend cho các luồng REST và realtime sau khi đã khôi phục nội dung.

### Thuộc tính chính
- `messageId`: định danh tin nhắn.
- `conversationId`: định danh cuộc trò chuyện.
- `senderId`: định danh người gửi.
- `content`: nội dung đã khôi phục, sẵn sàng hiển thị.
- `sentAt`: thời điểm gửi.
- `displayState`: trạng thái cho biết payload đang hiển thị bình thường hay đã gặp lỗi khôi phục.

### Validation rules
- `content` phải là nội dung hiển thị được với các tin nhắn xử lý thành công.
- Payload hiển thị mặc định không được để lộ `storedContent` trong các luồng xem chat thông thường.
