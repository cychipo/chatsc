# Quickstart: Gemini AI Chat Integration

## Prerequisites

- Node.js 18+
- Existing NestJS backend (backend/src/ structure)
- Existing React frontend (frontend/src/ structure)
- At least 1 Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

## 1. Environment Setup

### Add to `backend/.env`

```bash
# Gemini API Keys (comma-separated, no spaces)
GEMINI_API_KEYS=your-key-1,your-key-2,your-key-3

# Gemini Models (comma-separated)
GEMINI_MODELS=gemini-1.5-flash,gemini-1.5-pro

# Timeouts (milliseconds)
GEMINI_REQUEST_TIMEOUT_MS=30000
GEMINI_MODERATION_TIMEOUT_MS=5000
GEMINI_SUGGESTION_TIMEOUT_MS=10000

# Context
GEMINI_MAX_CONTEXT_MESSAGES=10

# Feature Toggles
AI_CHATBOT_ENABLED=true
AI_SUGGESTIONS_ENABLED=true
AI_MODERATION_ENABLED=true
```

### Add to `backend/.env.example`

```bash
GEMINI_API_KEYS=key1,key2,key3
GEMINI_MODELS=gemini-1.5-flash,gemini-1.5-pro
GEMINI_REQUEST_TIMEOUT_MS=30000
GEMINI_MODERATION_TIMEOUT_MS=5000
GEMINI_SUGGESTION_TIMEOUT_MS=10000
GEMINI_MAX_CONTEXT_MESSAGES=10
AI_CHATBOT_ENABLED=true
AI_SUGGESTIONS_ENABLED=true
AI_MODERATION_ENABLED=true
```

### Add to `frontend/.env.example`

```bash
VITE_AI_ENABLED=true
VITE_AI_SOCKET_NAMESPACE=/ai
```

---

## 2. Backend — Install Dependencies

```bash
cd backend
npm install @google/generative-ai
```

---

## 3. Backend — Add AI Module

**File**: `backend/src/config/env.config.ts` — extend `BackendEnv` type:

```typescript
GEMINI_API_KEYS: string
GEMINI_MODELS: string
GEMINI_REQUEST_TIMEOUT_MS: number
GEMINI_MODERATION_TIMEOUT_MS: number
GEMINI_SUGGESTION_TIMEOUT_MS: number
GEMINI_MAX_CONTEXT_MESSAGES: number
AI_CHATBOT_ENABLED: boolean
AI_SUGGESTIONS_ENABLED: boolean
AI_MODERATION_ENABLED: boolean
```

**File**: `backend/src/modules/ai/ai.module.ts` — NestJS module:

```typescript
@Module({
  imports: [ChatModule],
  providers: [
    AiConfigService,
    AiService,
    AiChatbotService,
    AiSuggestionsService,
    AiModerationService,
  ],
  exports: [AiService, AiChatbotService, AiSuggestionsService, AiModerationService],
})
export class AiModule {}
```

**File**: `backend/src/app.module.ts` — add `AiModule`:

```typescript
@Module({
  imports: [AiModule, ChatModule, ...],
})
export class AppModule {}
```

---

## 4. Backend — Extend Chat Gateway

In `backend/src/modules/chat/chat.gateway.ts`:

1. Import `AiChatbotService`, `AiSuggestionsService`, `AiModerationService`
2. On `message:create` event → call `AiModerationService.analyzeMessage()`
3. Add `@SubscribeMessage('ai:chat')` handler
4. Add `@SubscribeMessage('ai:suggestions:request')` handler
5. Emit `ai:response` back to client
6. Emit `ai:moderation:result` to sender

---

## 5. Frontend — Smart Reply UI

**File**: `frontend/src/features/chat/components/smart-reply-suggestions.tsx`

- Render 3 clickable suggestion chips above input box
- On click → fill input box with suggestion text
- Show loading skeleton while fetching suggestions
- Hide when no suggestions or AI disabled

---

## 6. Frontend — Moderation Display

**File**: `frontend/src/features/chat/components/message-moderation.tsx`

- Listen for `ai:moderation:result` socket event
- Display warning badge/icon on toxic messages
- Show sentiment emoji (positive/neutral/negative) on message bubble

---

## 7. Frontend — Chat Store Update

In `frontend/src/store/chat.store.ts`:

```typescript
interface ChatStore {
  aiChatbotEnabled: boolean
  aiSuggestionsEnabled: boolean
  aiModerationEnabled: boolean
  suggestions: [string, string, string]
  setSuggestions(suggestions: [string, string, string]): void
  toggleAiFeature(feature: 'chatbot' | 'suggestions' | 'moderation'): void
}
```

---

## 8. Verify Setup

1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser → go to chat
4. Send message with `/ai hello` → should receive AI response
5. Focus input box → should see 3 suggestions
6. Send a message → should see sentiment indicator

---

## Testing

```bash
# Backend unit tests
cd backend
npm test -- --testPathPattern=ai

# Backend integration tests
npm test -- --testPathPattern=ai-chatbot.integration
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI not responding | Check `GEMINI_API_KEYS` is set correctly |
| Rate limit errors | Add more API keys to `GEMINI_API_KEYS` |
| Suggestions not showing | Check `AI_SUGGESTIONS_ENABLED=true` |
| Moderation not working | Check `AI_MODERATION_ENABLED=true` |
| Timeout errors | Increase `GEMINI_REQUEST_TIMEOUT_MS` |
