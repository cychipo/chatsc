# Research: Trạng thái gửi/xem và hiện diện chat

## Decision 1: Tiếp tục dùng conversation preview realtime làm nguồn đồng bộ thứ tự danh sách chat
- **Decision**: Tái sử dụng luồng realtime đã có cho `conversation_preview_updated` để cập nhật preview, thời gian hoạt động cuối và đưa đoạn chat có tin nhắn mới lên đầu danh sách của cả hai phía.
- **Rationale**: Backend đã có `ChatGateway.emitConversationPreview()` và frontend đã có `updateConversationPreview()` sắp xếp danh sách theo `lastMessageAt`. Mở rộng payload preview là cách nhỏ nhất để đồng bộ thứ tự và metadata mới.
- **Alternatives considered**:
  - Tải lại toàn bộ danh sách chat sau mỗi tin nhắn: đơn giản nhưng gây thừa request và làm giảm trải nghiệm realtime.
  - Chỉ đẩy sự kiện message mà không có preview: frontend phải tự suy luận nhiều hơn và khó cập nhật đồng bộ thứ tự danh sách.

## Decision 2: Khôi phục participant direct chat đã left khi có tin nhắn mới thay vì tạo conversation trùng
- **Decision**: Với chat trực tiếp 1-1, khi người gửi nhắn tin mà người nhận đã `left` hoặc chưa còn participant active, hệ thống sẽ ưu tiên tìm lại direct conversation hiện có rồi khôi phục participant của người nhận về trạng thái active trước khi phát sự kiện mới.
- **Rationale**: `ChatService.findDirectConversation()` hiện chỉ tìm theo participant active nên chưa bao phủ case đã xoá/left. Khôi phục participant giúp giữ một direct conversation duy nhất giữa hai người và đáp ứng yêu cầu hiện lại đoạn chat khi có tin nhắn mới.
- **Alternatives considered**:
  - Tạo direct conversation mới mỗi lần người nhận đã xoá: dễ gây trùng conversation cho cùng hai người dùng.
  - Không khôi phục mà bắt người nhận tự tạo lại chat: trái với yêu cầu người dùng.

## Decision 3: Lưu unread/read state theo participant ở cấp conversation thay vì theo từng message riêng lẻ
- **Decision**: Theo dõi trạng thái đọc bằng metadata trên participant của từng đoạn chat, gồm mốc tin nhắn hoặc thời điểm cuối đã xem, và dùng mốc đó để suy ra unread count cũng như trạng thái sent/seen.
- **Rationale**: Yêu cầu hiện tại cần biết số tin chưa đọc theo conversation và trạng thái đã xem cho cụm tin nhắn gần nhất của người gửi, không cần receipt chi tiết cho từng người trong nhóm. Cấp participant là đủ cho direct chat và đơn giản hơn nhiều so với bảng receipt riêng.
- **Alternatives considered**:
  - Lưu trạng thái đã xem trên từng message: chính xác hơn nhưng phức tạp hơn mức cần thiết cho phạm vi hiện tại.
  - Chỉ lưu unread count không có read marker: khó suy ra trạng thái đã xem của cụm tin nhắn.

## Decision 4: Đánh dấu đã đọc khi người dùng mở đoạn chat đang xem
- **Decision**: Khi người dùng chọn một đoạn chat và hệ thống đã tải thread đó, conversation được xem là đã mở để đọc; unread count sẽ được cập nhật về đúng giá trị mới nhất và read marker được tiến lên.
- **Rationale**: Spec đã chốt hành vi “bấm vào thì mới đọc”. App hiện đã có luồng `selectConversation()` làm nơi trung tâm cho mở thread nên phù hợp để nối read flow vào đó.
- **Alternatives considered**:
  - Đánh dấu đã đọc ngay khi nhận message realtime nếu socket đang online: dễ sai với case người dùng chưa mở đúng đoạn chat.
  - Chỉ đánh dấu khi scroll tới cuối: chính xác hơn nhưng chưa được yêu cầu và làm tăng độ phức tạp.

## Decision 5: Sent/seen label hiển thị cho cụm tin nhắn outbound gần nhất của người gửi
- **Decision**: UI sẽ chỉ hiển thị text muted `Đã gửi` hoặc `Đã xem` dưới message cuối cùng trong cụm liên tiếp của cùng người gửi ở phía outbound, thay vì lặp dưới mọi bubble.
- **Rationale**: Đây là pattern gần với các app chat phổ biến, phù hợp với yêu cầu “1 tin nhắn hoặc 1 đoạn tin nhắn gửi liên tiếp”. Nó cũng tránh giao diện bị nhiễu khi người dùng gửi nhiều tin ngắn liên tiếp.
- **Alternatives considered**:
  - Hiển thị label dưới mọi tin nhắn: dễ hiểu nhưng rối UI.
  - Chỉ hiển thị label cho tin nhắn cuối toàn bộ thread: mất thông tin khi cụm mới chưa được xem.

## Decision 6: Typing indicator là tín hiệu realtime tạm thời theo conversation
- **Decision**: Dùng sự kiện realtime riêng cho typing presence trong phạm vi một conversation, gồm tín hiệu bắt đầu/cập nhật đang soạn và tự hết hạn nếu không còn hoạt động trong một khoảng ngắn.
- **Rationale**: Typing indicator là dữ liệu tạm thời, không cần lưu bền như message hay unread state. Socket gateway hiện có sẵn room theo conversation, phù hợp để phát tín hiệu này cho đúng người tham gia.
- **Alternatives considered**:
  - Lưu typing state vào DB: không cần thiết cho tín hiệu ngắn hạn.
  - Suy ra typing từ draft text lưu cục bộ: không thể chia sẻ giữa hai người dùng.

## Decision 7: Mở rộng contract conversation summary để mang unread và read status thay vì tạo endpoint danh sách riêng
- **Decision**: Mở rộng `listConversationsForUser()` và preview payload để trả thêm metadata cần cho unread count và read state, đồng thời bổ sung endpoint nhẹ để đánh dấu đã đọc nếu cần tách khỏi luồng lấy messages.
- **Rationale**: Frontend đã phụ thuộc vào `Conversation` summary và preview update. Gắn metadata mới vào cùng contract giúp UI cập nhật đồng nhất giữa tải ban đầu và realtime.
- **Alternatives considered**:
  - Tạo API riêng chỉ cho unread badge: tăng số round-trip và phân tán state.
  - Tính unread hoàn toàn ở frontend: không khả thi khi message history bị phân trang và user có thể offline.
