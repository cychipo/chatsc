# Research: Chat Groups

## 1) Binary transport từ Frontend -> Backend

- **Decision**: Dùng `ArrayBuffer` (UTF-8 encoded) từ frontend khi gửi message; backend decode bằng `TextDecoder('utf-8', { fatal: true })` trước khi xử lý.
- **Rationale**: Khớp yêu cầu FR-017/FR-018, API browser hỗ trợ tốt, dễ kiểm thử, và fail-fast khi payload lỗi định dạng.
- **Alternatives considered**:
  - Base64 string: dễ dùng nhưng không đúng yêu cầu “binary thay vì text thuần”, tăng kích thước payload.
  - protobuf/msgpack: mạnh nhưng tăng độ phức tạp không cần thiết cho scope hiện tại.

## 2) Mô hình hội thoại 1-1 và nhóm

- **Decision**: Dùng một `Conversation` chung với `type: direct|group`, tách `Message` và `MembershipEvent` thành collection riêng.
- **Rationale**: Tránh trùng lặp model giữa direct/group, thuận tiện mở rộng và phân trang lịch sử theo conversation.
- **Alternatives considered**:
  - Tách 2 collection `DirectConversation`/`GroupConversation`: dễ đọc ban đầu nhưng khó đồng bộ logic chung.

## 3) Lịch sử thành viên nhóm minh bạch

- **Decision**: Lưu biến động thành viên bằng `MembershipEvent` bất biến (added/joined/left/removed) có `actorUserId`, `targetUserId`, `occurredAt`.
- **Rationale**: Đáp ứng FR-008, FR-009, FR-013, SC-004; truy vết rõ “ai thêm ai, lúc nào”.
- **Alternatives considered**:
  - Chỉ lưu snapshot thành viên hiện tại: không truy được lịch sử minh bạch.

## 4) Quyền thao tác rời/xóa thành viên

- **Decision**: Quy tắc quyền ở service layer: thành viên hiện tại được `leave`; chỉ role quản lý (`owner|admin`) được `remove`.
- **Rationale**: Đáp ứng FR-010/FR-011, giữ logic quyền tập trung backend.
- **Alternatives considered**:
  - Kiểm tra quyền phía frontend: không an toàn, dễ bypass.

## 5) Phân trang lịch sử message

- **Decision**: Cursor-based pagination theo `sentAt` + `_id`, mặc định trả 10 bản ghi mới nhất, kéo lên lấy thêm 10 bản ghi cũ hơn.
- **Rationale**: Khớp FR-004/FR-005 và ổn định thứ tự theo FR-020.
- **Alternatives considered**:
  - Offset pagination: dễ lệch dữ liệu khi có tin mới đến đồng thời.

## 6) Đồng bộ realtime với luồng Linux kernel hiện tại

- **Decision**: Chat module đóng vai trò adapter/orchestrator; sau khi decode payload sẽ forward vào luồng backend hiện hữu kết nối nhân Linux, không thay thế core.
- **Rationale**: Khớp FR-021 và giả định trong spec.
- **Alternatives considered**:
  - Viết pipeline xử lý mới hoàn toàn cho chat: vượt phạm vi và tăng rủi ro tích hợp.

## 7) Xử lý edge cases quan trọng

- **Decision**:
  - Decode binary lỗi -> trả mã lỗi nghiệp vụ rõ ràng, frontend hiển thị trạng thái thất bại (FR-019).
  - Add thành viên trùng -> idempotent: không thêm lần 2, trả trạng thái phù hợp.
  - Người đã rời/bị xóa gửi message -> reject ở backend (FR-014).
- **Rationale**: Giảm lỗi dữ liệu và giữ hành vi nhất quán giữa UI/backend.
- **Alternatives considered**:
  - Im lặng bỏ qua lỗi: UX kém và khó debug.
