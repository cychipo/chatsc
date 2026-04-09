# Feature Specification: Gemini AI Chat Integration

**Feature Branch**: `014-gemini-ai-chat`
**Created**: 2026-04-08
**Status**: Draft
**Input**: Tích hợp AI chat bot với smart reply và content moderation dùng Gemini LLM, hỗ trợ rotate API key và model

## User Scenarios & Testing

### User Story 1 - AI Chat Bot tự động trả lời (Priority: P1)

Người dùng gửi tin nhắn với @mention bot hoặc prefix lệnh đặc biệt (ví dụ: `/ai`), hệ thống gọi Gemini AI và trả về câu trả lời thông minh trong cùng cuộc trò chuyện.

**Why this priority**: Đây là tính năng core - cho phép người dùng tương tác trực tiếp với AI trong chat.

**Independent Test**: Có thể test độc lập bằng cách gửi tin nhắn với @mention hoặc lệnh /ai và nhận phản hồi từ AI.

**Acceptance Scenarios**:

1. **Given** người dùng đang trong cuộc trò chuyện, **When** gửi tin nhắn kèm @mention bot (VD: "@chatai hôm nay trời mưa không?"), **Then** hệ thống gọi Gemini AI và hiển thị câu trả lời dưới dạng tin nhắn từ bot trong vòng 10 giây.
2. **Given** người dùng đang trong cuộc trò chuyện, **When** gửi tin nhắn bắt đầu bằng "/ai" (VD: "/ai kể cho tôi nghe một câu chuyện"), **Then** hệ thống gọi Gemini AI và hiển thị câu trả lời.
3. **Given** tin nhắn từ người dùng, **When** hệ thống nhận diện đúng intent là @mention hoặc /ai, **Then** context của cuộc trò chuyện (các tin nhắn gần nhất) được gửi kèm để AI hiểu ngữ cảnh.
4. **Given** API key đang bị rate limit, **When** người dùng gửi tin nhắn @mention bot, **Then** hệ thống tự động chuyển sang API key khác và xử lý bình thường.

---

### User Story 2 - Smart Reply Suggestions (Priority: P2)

Người dùng nhận được 3 gợi ý trả lời nhanh dựa trên nội dung tin nhắn cuối cùng trong cuộc trò chuyện, hiển thị ngay trên input box.

**Why this priority**: Tăng tốc độ trả lời tin nhắn, cải thiện trải nghiệm người dùng đặc biệt khi chat trên mobile.

**Independent Test**: Có thể test độc lập bằng cách mở cuộc trò chuyện và thấy 3 suggestions xuất hiện khi nhấn vào input box.

**Acceptance Scenarios**:

1. **Given** người dùng đang xem cuộc trò chuyện, **When** nhấn vào ô nhập tin nhắn, **Then** hệ thống hiển thị 3 gợi ý trả lời nhanh phía trên input box dựa trên tin nhắn gần nhất.
2. **Given** 3 suggestions đang hiển thị, **When** người dùng nhấn vào một suggestion, **Then** suggestion được điền vào ô nhập tin nhắn và người dùng có thể gửi hoặc chỉnh sửa trước khi gửi.
3. **Given** không có context tin nhắn (cuộc trò chuyện mới), **When** người dùng nhấn vào input box, **Then** không hiển thị suggestions.
4. **Given** API key đang bị rate limit, **When** hệ thống cần generate suggestions, **Then** hệ thống chuyển sang API key/model khác và vẫn trả về 3 suggestions.

---

### User Story 3 - Content Moderation & Sentiment Detection (Priority: P3)

Hệ thống tự động phân tích sentiment và phát hiện toxic content trong tin nhắn, hiển thị cảnh báo cho người nhận hoặc filter tin nhắn toxic.

**Why this priority**: Bảo vệ trải nghiệm người dùng, giảm toxic content trong nhóm chat, tăng tính an toàn cộng đồng.

**Independent Test**: Có thể test độc lập bằng cách gửi tin nhắn chứa từ ngữ toxic và quan sát cảnh báo hoặc filter.

**Acceptance Scenarios**:

1. **Given** người dùng gửi tin nhắn chứa nội dung toxic, **When** hệ thống nhận diện được toxic content, **Then** hiển thị cảnh báo cho người nhận (VD: "Nội dung này có thể gây khó chịu").
2. **Given** người dùng gửi tin nhắn có sentiment tiêu cực rất cao, **When** hệ thống phân tích xong, **Then** có thể hiển thị emoji cảm xúc tương ứng bên cạnh tin nhắn.
3. **Given** người dùng gửi tin nhắn với nội dung cực kỳ toxic (vi phạm nghiêm trọng), **When** hệ thống nhận diện, **Then** có tùy chọn filter/ẩn tin nhắn đó.
4. **Given** API moderation không khả dụng, **When** người dùng gửi tin nhắn, **Then** tin nhắn vẫn được gửi bình thường không có cảnh báo (graceful degradation).

---

### Edge Cases

- **Rate limit xảy ra**: Hệ thống tự động chuyển sang API key tiếp theo mà không ảnh hưởng trải nghiệm người dùng.
- **Tất cả API keys đều bị limit**: Thông báo cho người dùng biết AI tạm thời không khả dụng, không block tính năng chat thông thường.
- **Model không support tính năng**: Nếu model đang dùng không hỗ trợ, fallback sang model khác hoặc thông báo giới hạn.
- **Tin nhắn quá dài**: Cắt context từ cuộc trò chuyện để fit trong token limit của model.
- **Không có context cuộc trò chuyện**: Vẫn trả lời được câu hỏi đơn lẻ của người dùng.
- **Kết nối AI chậm**: Timeout sau 30 giây, thông báo cho người dùng và cho phép retry.
- **Smart reply với tin nhắn empty**: Không hiển thị suggestions khi không có nội dung để suggest.
- **Moderation không xác định được**: Xử lý như non-toxic, không cảnh báo.

## Requirements

### Functional Requirements

- **FR-001**: Hệ thống MUST cho phép cấu hình nhiều Gemini API keys trong file môi trường để rotate khi bị rate limit.
- **FR-002**: Hệ thống MUST cho phép cấu hình nhiều Gemini models trong file môi trường để rotate model khi cần.
- **FR-003**: Hệ thống MUST tự động chuyển sang API key/model khác khi gặp rate limit error.
- **FR-004**: Khi người dùng gửi tin nhắn với @mention bot hoặc prefix "/ai", hệ thống MUST gọi Gemini AI và trả về câu trả lời dưới dạng tin nhắn.
- **FR-005**: Tin nhắn từ AI MUST được hiển thị dưới dạng tin nhắn riêng biệt trong cuộc trò chuyện, không khác biệt với tin nhắn thông thường về format.
- **FR-006**: Khi generate smart reply suggestions, hệ thống MUST trả về đúng 3 suggestions dựa trên context tin nhắn gần nhất.
- **FR-007**: Smart reply suggestions MUST xuất hiện khi người dùng focus vào input box, và có thể được chọn để điền vào input.
- **FR-008**: Hệ thống MUST phân tích sentiment cho mỗi tin nhắn được gửi (positive, neutral, negative).
- **FR-009**: Hệ thống MUST nhận diện toxic content trong tin nhắn và hiển thị cảnh báo phù hợp.
- **FR-010**: Khi AI service không khả dụng, hệ thống MUST graceful degrade - vẫn cho phép gửi tin nhắn thông thường mà không có tính năng AI.
- **FR-011**: Timeout cho request đến AI service MUST không quá 30 giây.
- **FR-012**: Hệ thống MUST gửi kèm context (tối đa 10 tin nhắn gần nhất) khi gọi AI để có câu trả lời có ngữ cảnh.
- **FR-013**: Tất cả API keys và models phải được cấu hình qua biến môi trường, không hard-code trong code.

### Key Entities

- **AIConfig**: Cấu hình cho AI service, bao gồm danh sách API keys và danh sách models, current index cho việc rotate.
- **AIConversation**: Lưu trữ context của cuộc trò chuyện (tin nhắn gần nhất) để gửi kèm khi gọi AI.
- **ModerationResult**: Kết quả phân tích moderation cho một tin nhắn, bao gồm sentiment và toxicity score.
- **AISuggestion**: Kết quả smart reply - danh sách 3 suggestions được generate.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Người dùng nhận được phản hồi từ AI bot trong vòng 10 giây cho 90% các câu hỏi.
- **SC-002**: Hệ thống xử lý được rate limit và tiếp tục hoạt động mà không cần can thiệp thủ công trong 99% trường hợp.
- **SC-003**: Smart reply suggestions xuất hiện dưới 1 giây khi người dùng focus vào input box.
- **SC-004**: Toxic content được nhận diện với độ chính xác trên 85% (dựa trên tập test).
- **SC-005**: Graceful degradation đảm bảo 100% tin nhắn thông thường được gửi thành công ngay cả khi AI service down.
- **SC-006**: Người dùng có thể toggle on/off từng tính năng AI (bot, suggestions, moderation) riêng biệt.

## Assumptions

- Người dùng có ít nhất 1 Gemini API key hợp lệ để sử dụng dịch vụ.
- Gemini API cung cấp endpoint cho cả chat generation và content moderation (hoặc có thể dùng model để phân tích sentiment/toxicity).
- Project đã có hệ thống Socket.IO cho real-time messaging sẵn sàng tích hợp.
- Người dùng đã đăng nhập và có quyền gửi tin nhắn trong cuộc trò chuyện.
- File .env.example đã tồn tại trong project và có thể thêm các biến môi trường mới vào.
- Moderation có thể được thực hiện bằng cách gọi Gemini với prompt định sẵn thay vì dùng dedicated moderation API.
- Độ trễ của suggestions không ảnh hưởng đáng kể đến trải nghiệm người dùng (dưới 2 giây là chấp nhận được).
