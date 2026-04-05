# Quickstart: Chat Groups

## 1. Prerequisites
- Node.js LTS
- Yarn
- MongoDB đang chạy

## 2. Run backend
```bash
cd backend
yarn install
yarn dev
```

## 3. Run frontend
```bash
cd frontend
yarn install
yarn dev
```

## 4. Validate core scenarios

### 4.1 Direct chat + binary payload
1. Đăng nhập 2 tài khoản.
2. Mở direct conversation.
3. Gửi message từ user A.
4. Verify request body FE->BE là binary payload.
5. Verify BE decode thành text và user B nhận đúng nội dung.

### 4.2 Load history (10 + infinite scroll)
1. Tạo >= 25 message trong cùng conversation.
2. Reload chat.
3. Verify mặc định hiển thị 10 message mới nhất.
4. Scroll up 2 lần, mỗi lần nhận thêm 10 message cũ hơn (đến khi hết).

### 4.3 Group membership history
1. Tạo group bởi user A.
2. A thêm B và C.
3. Verify timeline hiển thị ai được thêm, ai thêm, thời điểm.

### 4.4 Leave/remove permissions
1. B tự rời nhóm, verify không gửi được message mới.
2. A remove C, verify C không còn active và không gửi được message.

### 4.5 Decode error UX
1. Gửi payload binary lỗi (không decode được UTF-8).
2. Verify backend trả lỗi nghiệp vụ.
3. Verify frontend hiển thị trạng thái gửi thất bại rõ ràng.

## 5. Implementation validation notes

### Backend tests passed
- `chat-direct-message.e2e-spec.ts`: tạo conversation, gửi/nhận message, validate membership.
- `chat-binary-decode.e2e-spec.ts`: decode UTF-8, reject invalid payload, reject empty/whitespace.
- `chat-history-pagination.e2e-spec.ts`: mặc định 10 tin, cursor pagination, cap limit 50.
- `chat-group-membership-events.e2e-spec.ts`: tạo group, add member, timeline events.
- `chat-group-leave.e2e-spec.ts`: leave group, tạo left event.
- `chat-group-remove-member.e2e-spec.ts`: owner/admin remove, reject từ member thường.
- `chat-group-forbidden-send.e2e-spec.ts`: reject gửi khi không còn active.

### Frontend tests available
- `chat-direct-thread.test.tsx`: render conversation list, thread, composer.
- `chat-group-timeline.test.tsx`: membership events loading.
- `chat-layout.test.tsx`: 3 vùng layout.
- `chat-bubble-variant.test.tsx`: mine/theirs bubble styling.

### API endpoints implemented
- `GET /chat/conversations` - list conversations
- `POST /chat/conversations` - create direct/group
- `GET /chat/conversations/:id/messages` - paginated messages
- `POST /chat/conversations/:id/messages` - send binary message
- `POST /chat/conversations/:id/members` - add member
- `DELETE /chat/conversations/:id/members/:userId` - remove member
- `POST /chat/conversations/:id/leave` - leave conversation
- `GET /chat/conversations/:id/events` - membership timeline
