# Research: Gửi tin nhắn qua Socket

## Quyết định 1: Dùng WebSocket gateway đã xác thực cho gửi/nhận tin nhắn thời gian thực
- **Decision**: Thêm một kênh kết nối thời gian thực dành riêng cho chat, yêu cầu người dùng đã đăng nhập mới được kết nối và gửi sự kiện tin nhắn.
- **Rationale**: Tính năng yêu cầu chuyển từ mô hình request-response sang realtime delivery, đồng thời vẫn phải giữ nguyên kiểm tra quyền tham gia cuộc trò chuyện.
- **Alternatives considered**:
  - Giữ REST cho gửi, chỉ dùng realtime cho nhận: không đạt yêu cầu đặc tả vì việc gửi vẫn phụ thuộc request-response.
  - Polling định kỳ: không đạt mục tiêu realtime và gây trễ trải nghiệm.

## Quyết định 2: Giữ REST để tải lịch sử, dùng socket cho live delivery
- **Decision**: Lịch sử tin nhắn và dữ liệu conversation hiện có vẫn được tải bằng API hiện tại; socket chỉ dùng cho kết nối, subscribe conversation, gửi message và nhận message mới.
- **Rationale**: Spec chỉ thay đổi live delivery behavior, không yêu cầu thay thế toàn bộ cơ chế đọc dữ liệu hiện có. Cách này giảm rủi ro và tận dụng codebase hiện tại.
- **Alternatives considered**:
  - Chuyển toàn bộ chat sang socket-only: phạm vi lớn hơn spec, phức tạp hơn cho load history, pagination và refresh.

## Quyết định 3: Reuse ChatService để persist message và enforce membership
- **Decision**: Gateway thời gian thực sẽ gọi lại `ChatService.sendMessage`, `getActiveParticipant`, và các quy tắc truy cập hiện có thay vì tạo service mới cho message persistence.
- **Rationale**: Codebase đã có logic kiểm tra participant và ghi message ổn định; reuse giúp giữ nhất quán dữ liệu giữa REST và socket paths.
- **Alternatives considered**:
  - Viết luồng persistence riêng cho gateway: dễ gây lệch behavior giữa hai đường xử lý.

## Quyết định 4: Client tham gia phòng conversation đang mở để nhận tin nhắn đúng phạm vi
- **Decision**: Khi người dùng chọn một conversation, client sẽ đăng ký nhận cập nhật realtime cho conversation đó; khi chuyển conversation, client rời phòng cũ và tham gia phòng mới.
- **Rationale**: Spec yêu cầu nhận tin nhắn tức thời theo conversation mà người dùng có quyền truy cập, đồng thời hạn chế broadcast không cần thiết.
- **Alternatives considered**:
  - Broadcast mọi tin nhắn tới mọi kết nối đã xác thực: dư thừa và khó kiểm soát phạm vi cập nhật.

## Quyết định 5: Dùng message identifier từ server để tránh hiển thị trùng
- **Decision**: Mỗi message được server xác nhận sẽ mang định danh chuẩn từ persistence layer; client dedupe theo message id khi nhận realtime event.
- **Rationale**: Spec yêu cầu tránh duplicate display khi reconnect hoặc bấm gửi lặp lại.
- **Alternatives considered**:
  - Chỉ dedupe theo text + timestamp phía client: không đủ tin cậy.

## Quyết định 6: Thể hiện trạng thái kết nối rõ ràng ở frontend
- **Decision**: Frontend lưu và hiển thị trạng thái `connecting`, `connected`, `disconnected`, `reconnecting`, và chặn hoặc cảnh báo khi người dùng gửi tin nhắn lúc chưa kết nối.
- **Rationale**: Spec yêu cầu người dùng biết khi kết nối không khả dụng và có thể tiếp tục sau reconnect.
- **Alternatives considered**:
  - Reconnect ngầm hoàn toàn không có trạng thái UI: không đạt yêu cầu minh bạch lỗi gửi.

## Quyết định 7: Giữ Enter để gửi, Shift+Enter để xuống dòng trên socket flow
- **Decision**: Tái sử dụng hành vi composer hiện có cho socket send action.
- **Rationale**: Hành vi này đã tồn tại ở frontend và phù hợp với yêu cầu chức năng trong spec.
- **Alternatives considered**:
  - Đổi lại thành click-only khi dùng socket: làm giảm trải nghiệm và trái spec.
