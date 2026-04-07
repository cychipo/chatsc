# Contract: Chat UI Controls

## 1. Conversation Layout Control Contract

### Purpose
Defines the UI behavior expected when the user toggles the conversation sidebar from the menu button.

### Expected behavior
- The menu button on the chat header toggles the sidebar between expanded and collapsed states.
- Toggling the sidebar must not change the selected conversation.
- Toggling the sidebar must not clear loaded messages or composer input.

## 2. Message Search Request Contract

### Purpose
Defines the request used to search messages in the currently active conversation.

### Request shape
`GET /chat/conversations/:conversationId/messages/search?q={query}`

### Rules
- `conversationId` must belong to a conversation where the requester is an active participant.
- `q` must be the user-entered search string.
- Empty or whitespace-only queries should return an empty result set or be rejected consistently before expensive search work.

## 3. Message Search Response Contract

### Purpose
Returns matching messages for the active conversation search popup.

### Response shape
Each result should include at minimum:
- `messageId`
- `conversationId`
- `senderId`
- `senderDisplayName`
- `senderAvatarUrl` when available
- `content`
- `sentAt`
- any existing display/decode status fields needed for UI rendering

### Behavior
- Results must only include matches from the specified conversation.
- Results must provide enough sender context to distinguish identical matches from different participants.
- No-results searches must map cleanly to a clear empty state in the popup.

## 4. Message Thread Rendering Contract

### Purpose
Defines the frontend data needed to render message bubbles with avatars instead of generic icons.

### Required data
For each rendered message, the UI needs:
- sender identity
- sender display label
- sender avatar image URL when available
- fallback-safe avatar representation when no image exists

### Behavior
- Incoming messages must display sender avatars instead of the current generic icon.
- Messages from senders without avatar images must still render a default avatar placeholder.
- Rendering must remain stable for direct and group conversations.

## 5. Search Popup Interaction Contract

### Purpose
Defines expected UI behavior for the search popup in the active conversation.

### Behavior
- The search button opens the popup only in the context of the active conversation.
- Closing the popup returns the user to the unchanged conversation view.
- The popup must surface loading, result, and empty states clearly.
- Search results should be selectable or otherwise readable enough for the user to identify the intended message.

## 6. Failure Cases

- If no conversation is selected, the search action must not open an irrelevant search flow without guidance.
- If the user is not authorized for the conversation, the backend search contract must reject the request.
- If sender avatar data is missing, the UI must render a fallback avatar rather than leaving blank space.
- If multiple results share the same text, each result must still expose enough context to avoid ambiguity.