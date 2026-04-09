# Socket.IO Event Contracts: AI Features

## Namespace: `/ai`

All AI events use a separate Socket.IO namespace `/ai` to keep AI logic isolated from chat logic.

### Event Flow Overview

```
Client ──(socket.connect)──> /ai namespace
Client ──(ai:chat)──> Server ──(Gemini)──> Server ──(ai:response)──> Client
Client ──(ai:suggestions:request)──> Server ──(Gemini)──> Server ──(ai:suggestions:response)──> Client
Server ──(ai:moderation:result)──> Client  (server-initiated after message sent)
```

---

## Client → Server Events

### `ai:chat`

Trigger AI bot response via @mention or /ai command.

**Payload**:
```typescript
interface AiChatRequest {
  conversationId: string    // Conversation ID
  messageId: string         // Original message ID (for threading)
  text: string              // User's message text (includes @mention or /ai prefix)
  senderId: string          // User ID who sent the message
}
```

**Expected Response** (server → client via `ai:response`):
```typescript
interface AiChatResponse {
  messageId: string         // ID of the new AI message created
  conversationId: string
  text: string              // AI's response text
  senderId: 'ai-bot'        // Special sender ID for bot
  timestamp: string         // ISO 8601 timestamp
}
```

---

### `ai:suggestions:request`

Request smart reply suggestions for a conversation.

**Payload**:
```typescript
interface AiSuggestionsRequest {
  conversationId: string    // Conversation ID
  lastMessageId: string     // ID of the last message to generate suggestions for
}
```

**Expected Response** (server → client via `ai:suggestions:response`):
```typescript
interface AiSuggestionsResponse {
  conversationId: string
  suggestions: [string, string, string]  // Exactly 3 suggestions
  lastMessageId: string
  generatedAt: string        // ISO 8601 timestamp
}
```

---

## Server → Client Events (Server-Initiated)

### `ai:response`

Sent to all clients in the conversation when AI bot responds.

**Payload**: Same as `AiChatResponse` above.

**Delivery**: Broadcast to all clients in the conversation room (`conversation:${conversationId}`).

---

### `ai:moderation:result`

Sent to the message sender when moderation analysis completes.

**Payload**:
```typescript
interface AiModerationResult {
  messageId: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number      // -1.0 to 1.0
  toxicityScore: number       // 0.0 to 1.0
  isToxic: boolean
  warningMessage?: string     // e.g., "Nội dung này có thể gây khó chịu"
}
```

**Delivery**: Emitted to the specific client who sent the message (`to: socketId`).

---

### `ai:error`

Sent to the requesting client when AI processing fails.

**Payload**:
```typescript
interface AiError {
  originalEvent: 'ai:chat' | 'ai:suggestions:request'
  conversationId: string
  error: string              // Human-readable error message
  isRateLimited: boolean     // True if error is due to rate limiting
  retryAfter?: number        // Seconds until retry suggested (if rate limited)
}
```

**Delivery**: Emitted only to the requesting client (`to: socketId`).

---

## Error Codes

| Code | Meaning |
|------|---------|
| `AI_ERROR_RATE_LIMITED` | All API keys exhausted, retry after cooldown |
| `AI_ERROR_TIMEOUT` | AI request timed out |
| `AI_ERROR_INVALID_RESPONSE` | AI returned malformed response |
| `AI_ERROR_DISABLED` | AI feature is disabled for this user/conversation |
| `AI_ERROR_SERVICE_UNAVAILABLE` | All AI services unavailable |

---

## Room Structure

```
/ai namespace
└── conversation:${conversationId}
    └── user:${userId}       # Joined per user for ai:moderation:result
```

---

## Auth

- Client must be authenticated on main namespace before joining `/ai`
- `ai:chat` and `ai:suggestions:request` validate user has access to the conversation
- `ai:moderation:result` delivered only to message sender
