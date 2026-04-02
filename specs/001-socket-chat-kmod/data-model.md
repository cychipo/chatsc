# Data Model: Hệ thống chat Socket với Docker và Kernel Module

## 1. Chat Message

**Description**: Nội dung nghiệp vụ do client gửi đi để chat hoặc yêu cầu driver xử lý.

**Fields**:
- `message_id`: Định danh duy nhất của message trong phạm vi phiên làm việc.
- `payload`: Nội dung gốc mà người dùng nhập.
- `processing_mode`: Chế độ xử lý được yêu cầu cho message.
- `created_at`: Thời điểm message được tạo.
- `status`: Trạng thái hiện tại của message trong vòng đời xử lý.

**Validation Rules**:
- `payload` không được rỗng đối với request hợp lệ.
- `processing_mode` phải thuộc tập chế độ được hệ thống công bố.
- `message_id` phải duy nhất trong phạm vi một phiên xử lý.

**State Transitions**:
- `created` → `queued_for_device`
- `queued_for_device` → `processing_in_driver`
- `processing_in_driver` → `completed`
- `processing_in_driver` → `failed`

## 2. Client Session

**Description**: Đại diện cho một phiên tương tác của client với server và với device.

**Fields**:
- `session_id`: Định danh phiên.
- `client_identity`: Thông tin nhận diện logic của client trong phiên.
- `connection_state`: Trạng thái kết nối của client.
- `started_at`: Thời điểm bắt đầu phiên.
- `ended_at`: Thời điểm kết thúc phiên nếu có.

**Validation Rules**:
- Mỗi phiên phải có `session_id` hợp lệ.
- `connection_state` phải phản ánh đúng một trong các trạng thái được định nghĩa.

**State Transitions**:
- `initialized` → `connected`
- `connected` → `active`
- `active` → `disconnected`
- `active` → `terminated`

## 3. Device Request

**Description**: Một lần tương tác của client với device node để gửi dữ liệu hoặc đọc kết quả từ driver.

**Fields**:
- `request_id`: Định danh yêu cầu.
- `session_id`: Phiên client sở hữu request.
- `message_id`: Message gắn với request này.
- `operation_type`: Loại thao tác với device.
- `submitted_at`: Thời điểm gửi request.
- `completion_state`: Kết quả xử lý ở mức request.

**Validation Rules**:
- Mỗi `Device Request` phải gắn với đúng một `Chat Message`.
- `operation_type` phải là thao tác hợp lệ trong luồng thiết kế.
- `completion_state` phải thể hiện rõ request thành công hay thất bại.

**Relationships**:
- Một `Client Session` có thể có nhiều `Device Request`.
- Mỗi `Device Request` gắn với đúng một `Chat Message`.

## 4. Driver Processing Result

**Description**: Kết quả được driver trả về sau khi xử lý một message đầu vào.

**Fields**:
- `result_id`: Định danh kết quả.
- `message_id`: Message nguồn tạo ra kết quả.
- `result_type`: Loại kết quả trả về.
- `result_payload`: Nội dung kết quả.
- `generated_at`: Thời điểm tạo kết quả.
- `result_status`: Trạng thái hợp lệ của kết quả.

**Validation Rules**:
- Mỗi kết quả phải gắn với đúng một `message_id`.
- `result_type` phải khớp với `processing_mode` của message tương ứng.
- `result_payload` không được rỗng nếu request hoàn tất thành công.

**Relationships**:
- Mỗi `Chat Message` sinh tối đa một `Driver Processing Result` trong phạm vi v1.

## 5. Module Lifecycle Event

**Description**: Bản ghi logic về các sự kiện quan trọng trong vòng đời của driver và device.

**Fields**:
- `event_id`: Định danh sự kiện.
- `event_type`: Loại sự kiện vòng đời.
- `event_time`: Thời điểm sự kiện xảy ra.
- `event_actor`: Thành phần hoặc tác nhân kích hoạt sự kiện.
- `event_outcome`: Kết quả của sự kiện.
- `event_detail`: Nội dung bổ sung phục vụ chẩn đoán.

**Validation Rules**:
- Mọi sự kiện vòng đời chính phải có `event_type` và `event_time`.
- `event_outcome` phải thể hiện rõ thành công, thất bại hoặc bị chặn.

## Enumerations

### Processing Mode
- `substitution`
- `sha1`

### Connection State
- `initialized`
- `connected`
- `active`
- `disconnected`
- `terminated`

### Operation Type
- `open_device`
- `write_message`
- `read_result`
- `close_device`

### Result Type
- `substituted_text`
- `sha1_digest`

### Event Type
- `module_loaded`
- `module_unload_requested`
- `module_unloaded`
- `device_opened`
- `device_read`
- `device_written`
- `device_closed`
- `socket_connected`
- `socket_disconnected`

## Relationship Summary

- Một `Client Session` bao gồm nhiều `Chat Message` và nhiều `Device Request`.
- Mỗi `Chat Message` đi qua tối đa một `Device Request` xử lý chính trong phạm vi demo v1.
- Mỗi `Chat Message` sinh ra tối đa một `Driver Processing Result`.
- `Module Lifecycle Event` ghi lại các mốc vận hành cắt ngang toàn bộ hệ thống.
