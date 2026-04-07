# Feature Specification: Chat UI Controls

**Feature Branch**: `012-chat-ui-controls`  
**Created**: 2026-04-07  
**Status**: Draft  
**Input**: User description: "muốn bổ sung thêm tính năng cho các nút trên UI, bấm vào nút menu sẽ thu nhỏ/phóng to sidebar, bấm nút tìm kiếm sẽ hiện popup tìm kiếm tin nhắn trong đoạn chat, hiển thị avatar user trong đoạn chat thay vì icon"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search messages in the current conversation (Priority: P1)

As a chat user, I want the search button to open a message search popup for the current conversation so that I can quickly find specific content without leaving the chat thread.

**Why this priority**: Searching within a conversation is the primary behavior change still in scope and directly affects how users retrieve existing chat content.

**Independent Test**: Can be fully tested by opening a conversation, pressing the search button, entering a keyword, and verifying matching messages from the current conversation are shown in the popup.

**Acceptance Scenarios**:

1. **Given** the user is viewing a conversation, **When** the user presses the search button, **Then** a search popup for that conversation is displayed.
2. **Given** the search popup is open, **When** the user enters a keyword that exists in the current conversation, **Then** matching messages from that conversation are shown.
3. **Given** the search popup is open, **When** the user enters a keyword with no matches, **Then** the popup shows a clear no-results state.
4. **Given** the search popup is open, **When** the user closes it, **Then** the user returns to the same conversation view unchanged.

---

### User Story 2 - Show user avatars in messages (Priority: P2)

As a chat user, I want each message to show the sender's avatar instead of a generic icon so that I can identify participants faster and the conversation feels more personal.

**Why this priority**: Avatar display improves recognition and readability, but it enhances an existing message view rather than unlocking a new core interaction.

**Independent Test**: Can be fully tested by opening a conversation with messages from one or more participants and verifying each message row shows the sender avatar in place of the generic icon.

**Acceptance Scenarios**:

1. **Given** a conversation contains messages from participants with profile images, **When** the messages are displayed, **Then** each message shows the sender's avatar instead of a generic icon.
2. **Given** a participant does not have a profile image, **When** their message is displayed, **Then** the message shows a consistent default avatar representation rather than leaving the space empty.
3. **Given** consecutive messages from different participants are shown, **When** the user scans the conversation, **Then** avatar differences help distinguish senders at a glance.

---

### Edge Cases

- If the user presses the search button when no conversation is currently selected, the system must prevent an irrelevant search flow and show a clear indication that a conversation must be opened first.
- If a conversation has a large number of messages, the search popup must still present results clearly enough for the user to identify the correct message.
- If a participant has no uploaded profile image, the interface must show a default avatar placeholder that preserves message alignment.
- If message search returns identical text from multiple messages, the results must provide enough context for the user to distinguish which match they want.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST open a message search popup for the active conversation when the user presses the search button.
- **FR-002**: The system MUST allow users to enter a search term in the popup and view matching messages from the currently active conversation only.
- **FR-003**: The system MUST perform message search against the readable message content shown to users, including conversations whose stored content is encrypted at rest.
- **FR-004**: The system MUST show a clear empty state when a search in the current conversation returns no matching messages.
- **FR-005**: The system MUST allow the user to close the search popup and return to the same conversation state they were viewing before opening it.
- **FR-006**: The system MUST display the sender avatar for each message in the conversation view instead of a generic message icon.
- **FR-007**: The system MUST show a default avatar placeholder when a sender does not have a profile image.
- **FR-008**: The system MUST keep avatar placement visually consistent across messages so sender identity remains easy to scan throughout the conversation.

### Key Entities *(include if feature involves data)*

- **Conversation View State**: Represents the current chat screen state, including the selected conversation and whether the search popup is open.
- **Message Search Query**: Represents the user-entered text used to find matching messages within the active conversation.
- **Message Search Result**: Represents a message in the active conversation that matches the search term and includes enough context for the user to recognize it.
- **Message Sender Profile**: Represents the visual identity of a message sender, including avatar image or default avatar fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In user acceptance testing, at least 90% of tested users can open the message search popup and find a known message in the current conversation on their first attempt.
- **SC-002**: When a search term has matching content, 95% of searches show relevant results from the active conversation without requiring the user to navigate away from the chat.
- **SC-003**: In visual review of conversation threads, 100% of displayed messages show either a sender avatar or a default avatar placeholder instead of a generic icon.

## Assumptions

- The feature applies to the existing chat screen used for desktop or large-screen conversation viewing.
- The menu button and search button already exist in the current chat interface and are being enhanced rather than newly introduced.
- Message search is limited to the conversation currently open on screen and does not search across all conversations.
- Existing user profile data already provides either an avatar image or enough information to render a default avatar placeholder.
- This feature does not change permissions, conversation membership rules, or message content itself.