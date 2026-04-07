# Data Model: Chat UI Controls

## 1. Conversation View State

### Purpose
Represents the UI state of the active chat screen while the user is navigating conversations and using header controls.

### Fields
- `selectedConversationId`: conversation currently open in the thread panel.
- `isSidebarCollapsed`: whether the conversation sidebar is collapsed.
- `isMessageSearchOpen`: whether the in-conversation search popup is open.
- `connectionState`: current realtime connectivity indicator already used by the chat view.

### State Transitions
- Default view → sidebar expanded.
- Expanded → collapsed when the user presses the menu button.
- Collapsed → expanded when the user presses the menu button again.
- Search closed → search open when the user presses the search button with an active conversation selected.
- Search open → search closed when the user dismisses the popup.

## 2. Message Search Query

### Purpose
Represents the text the user enters to search message content within the active conversation.

### Fields
- `conversationId`: the currently active conversation scope.
- `query`: user-entered text.
- `submittedAt` or request timing metadata in runtime state.

### Validation Rules
- Search must remain scoped to the active conversation only.
- Empty or whitespace-only queries must not trigger a normal search result request.
- The query must be safe to use in backend filtering after escaping reserved regex characters.

## 3. Message Search Result

### Purpose
Represents a message returned from the conversation search flow and shown inside the popup.

### Fields
- `messageId`
- `conversationId`
- `senderId`
- `senderDisplayName`
- `senderAvatarUrl` or equivalent fallback source
- `content`
- `sentAt`
- `displayState` when message rendering status matters

### Validation Rules
- Every result must belong to the active conversation.
- Results must contain enough sender metadata to distinguish identical text from different participants.
- Results should be sorted so the user can understand where each match sits in the conversation timeline.

## 4. Message Sender Presentation

### Purpose
Represents the sender identity data needed to render avatars in both message bubbles and search results.

### Fields
- `senderId`
- `displayName`
- `avatarUrl` when available
- `fallbackLabel` derived from a display name initial when no avatar image exists

### Validation Rules
- Each rendered message must show either an avatar image or a stable fallback avatar.
- Fallback rendering must preserve the same spacing and alignment as image-based avatars.
- Self messages and other-user messages must remain visually distinguishable without relying on a generic icon.

## 5. Chat Message Payload

### Purpose
Represents the frontend-facing message object used in the thread and now extended to support avatar rendering and search result display.

### Fields
- Existing fields: `messageId/_id`, `conversationId`, `senderId`, `content`, `sentAt`, status fields
- Added presentation fields: `senderDisplayName`, `senderAvatarUrl` or fallback-ready equivalent

### Relationships
- A message belongs to one conversation.
- A message search result is a filtered view of a chat message payload.
- Sender presentation metadata is attached to message rendering rather than stored as separate frontend lookups for this feature.