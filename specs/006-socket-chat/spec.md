# Feature Specification: Socket Message Delivery

**Feature Branch**: `006-socket-chat`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "bây giờ tôi muốn tạo spec cho phần gửi tin nhắn qua socket thay vì resfulapI, bạn tạo giúp tôi nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send messages instantly in an active chat (Priority: P1)

As a signed-in user, I want messages I send in a chat to be delivered through a persistent real-time connection so that I do not depend on repeated request-response submission for every message.

**Why this priority**: Sending a message is the core chat action. Without this, the chat experience remains delayed and inconsistent with user expectations for messaging.

**Independent Test**: Open an existing conversation, send a message from one client, and verify that the message appears in the conversation immediately without requiring a page refresh or manual reload.

**Acceptance Scenarios**:

1. **Given** a signed-in user is connected to chat and has an active conversation open, **When** the user sends a message, **Then** the message is accepted through the live connection and appears in the conversation immediately.
2. **Given** a signed-in user sends a non-empty message through the chat composer, **When** delivery succeeds, **Then** the message is shown once in the conversation and the composer is cleared.
3. **Given** a signed-in user attempts to send an empty message, **When** the send action is triggered, **Then** the system rejects the message and keeps the conversation unchanged.

---

### User Story 2 - Receive messages in real time from other participants (Priority: P2)

As a conversation participant, I want to receive incoming messages as soon as they are sent so that I can follow the conversation live without refreshing the page.

**Why this priority**: Real-time receipt is the main value unlocked by moving chat delivery away from request-response messaging.

**Independent Test**: Open the same conversation in two active sessions, send a message from one session, and verify that the other session shows the new message in the open conversation without manual refresh.

**Acceptance Scenarios**:

1. **Given** two users are connected to the same conversation, **When** one user sends a message, **Then** the other user sees the message appear in that conversation immediately.
2. **Given** a user is viewing the conversation list instead of the open thread, **When** a new message arrives in a joined conversation, **Then** the conversation preview and ordering update without a page refresh.

---

### User Story 3 - Recover gracefully from connection interruptions (Priority: P3)

As a signed-in user, I want the chat experience to recover when the live connection drops temporarily so that brief network issues do not force me to restart the app or lose confidence in message delivery.

**Why this priority**: Real-time chat is only trustworthy if users can understand and recover from intermittent connection problems.

**Independent Test**: Disconnect the client during an active chat session, restore connectivity, and verify that the user can reconnect and continue sending messages without reopening the application.

**Acceptance Scenarios**:

1. **Given** a user loses network connectivity during an active chat session, **When** the live connection drops, **Then** the user is informed that chat is temporarily disconnected.
2. **Given** connectivity becomes available again, **When** the client reconnects, **Then** the user can resume sending messages in joined conversations.
3. **Given** a user tries to send a message while the live connection is unavailable, **When** the send attempt occurs, **Then** the system makes the failure state clear and does not silently lose the message.

---

### Edge Cases

- What happens when a user opens a conversation before the live connection is fully established?
- How does the system handle a user who is no longer an active participant in a conversation but still has the chat screen open?
- What happens when the same user has multiple active sessions connected to the same conversation?
- How does the system handle duplicate delivery attempts caused by reconnect or repeated send actions?
- What happens when an incoming message arrives for a conversation that is not currently selected?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow signed-in users to send chat messages over a persistent live connection instead of relying on per-message request-response submission.
- **FR-002**: The system MUST only accept message sends from users who are active participants in the target conversation.
- **FR-003**: Users MUST be able to send a message from the chat composer by pressing the send action or pressing Enter, while preserving Shift+Enter for line breaks.
- **FR-004**: The system MUST deliver newly sent messages to all currently connected participants of the conversation without requiring page refresh.
- **FR-005**: The system MUST update the active conversation thread immediately after a message is successfully delivered.
- **FR-006**: The system MUST update conversation previews and ordering when a new message is delivered to a conversation the user can access.
- **FR-007**: The system MUST reject empty or whitespace-only messages before delivery.
- **FR-008**: The system MUST make delivery failures visible to the sender when a message cannot be accepted or transmitted.
- **FR-009**: The system MUST indicate when the live chat connection is unavailable and when it becomes available again.
- **FR-010**: The system MUST allow users to resume chat activity after temporary disconnection without requiring a full page reload.
- **FR-011**: The system MUST prevent duplicate message display for the same delivered message in a client session.
- **FR-012**: The system MUST preserve existing conversation permissions and membership rules for message delivery and receipt.

### Key Entities *(include if feature involves data)*

- **Live Chat Session**: Represents an authenticated user's active real-time connection state, including whether the session is connected, disconnected, or reconnecting.
- **Conversation Message**: Represents a delivered chat message associated with a conversation, sender, send time, and delivery outcome visible to participants.
- **Conversation Subscription**: Represents the relationship between a live client session and the conversations it is currently allowed to receive updates for.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In active conversations, users see their successfully sent messages appear in the thread in under 1 second in normal network conditions.
- **SC-002**: In active conversations with two connected participants, 95% of new messages appear to the receiving participant in under 1 second in normal network conditions.
- **SC-003**: 100% of empty-message send attempts are rejected without creating a visible chat entry.
- **SC-004**: After a temporary connection interruption shorter than 30 seconds, users can resume sending messages without reloading the application.
- **SC-005**: In validation testing, no delivered message appears more than once in the same client session for a single send action.

## Assumptions

- Existing authentication and conversation membership rules remain the source of truth for deciding who may send and receive messages.
- Existing message history retrieval remains available for loading prior messages; this feature changes live delivery behavior rather than replacing message history access.
- The initial scope covers browser-based chat usage in the current application experience.
- Conversation creation, user search, and conversation list management remain part of the existing chat flow and are not redefined by this feature.
