# Research: Gemini AI Chat Integration

## Research Topics

### 1. Gemini API SDK for Node.js

**Decision**: Use `@google/generative-ai` SDK (official Google SDK for Node.js)

**Rationale**:
- Official SDK maintained by Google, supports all Gemini models (gemini-1.5-flash, gemini-1.5-pro, etc.)
- Built-in streaming support
- Simple API: `model.generateContent()` with text and multi-modal inputs
- Supports `safetySettings` for content filtering
- Handles JSON mode for structured responses

**Alternatives considered**:
- Direct REST API calls via `axios` — rejected: less type-safe, more boilerplate
- Third-party wrapper libraries — rejected: not needed, official SDK is sufficient

---

### 2. Gemini Models for Chat Use Cases

**Decision**: Support configurable model list via env vars, default to `gemini-1.5-flash`

**Rationale**:
- `gemini-1.5-flash`: Fast, low cost, ideal for real-time chat (<1s response)
- `gemini-1.5-pro`: Higher quality for complex queries, slightly slower
- Rotate models based on availability and use case (chat bot vs. moderation vs. suggestions)

**Rotation strategy**:
- Round-robin by default
- Switch on rate limit (429) or quota error
- Each request picks from available (non-rate-limited) model list

---

### 3. Multi-API Key Rotation Strategy

**Decision**: Round-robin rotation with per-key rate limit detection and graceful fallback

**Rationale**:
- Env var stores comma-separated API keys: `GEMINI_API_KEYS=key1,key2,key3`
- Keep current index per request cycle
- On 429 (RESOURCE_EXHAUSTED) or 403 (quota) error → try next key
- Track consecutive failures per key to skip temporarily
- If all keys exhausted → return error to client, not block message sending

**Key state tracking**:
```typescript
interface KeyState {
  key: string;
  consecutiveFailures: number;
  lastError?: string;
}
```

---

### 4. Prompt-Based Moderation vs. Dedicated API

**Decision**: Use prompt-based analysis with Gemini for both sentiment and toxicity detection

**Rationale**:
- Gemini 1.5 models have strong zero-shot classification capabilities
- Simpler integration: single API endpoint for all AI features
- Response as structured JSON for easy parsing
- Trade-off: slightly slower than dedicated API but eliminates extra service dependency

**Prompt strategy**:
- Send message text to Gemini with classification prompt
- Request JSON response: `{ sentiment: "positive|neutral|negative", toxicity_score: 0.0-1.0, is_toxic: boolean }`
- Timeout: 5s for moderation (faster than full chat response)

---

### 5. Context Window Management

**Decision**: Send last 10 messages as conversation history, truncate if exceeds token limit

**Rationale**:
- Gemini's context window is large (1M tokens for 1.5 models)
- Limit to 10 messages for performance and cost efficiency
- Truncate oldest messages first if combined context exceeds ~8K tokens estimate
- Each message stored as `{ role: "user"|"model", text: string }`

---

### 6. Smart Reply Generation Prompt Strategy

**Decision**: Single prompt generates exactly 3 reply suggestions in JSON array format

**Prompt design**:
- Include last message as context
- Request: "Generate 3 short reply suggestions (each < 50 chars) in JSON array format: [\"reply1\", \"reply2\", \"reply3\"]"
- Use `generationConfig: { responseMimeType: "application/json" }` for structured output

---

### 7. Socket.IO Event Design

**Decision**: New namespace `/ai` to separate AI events from chat events

**Rationale**:
- Cleaner separation of concerns
- Different auth requirements (AI features can be user-togglable)
- Easier to scale AI service independently in future

**Events**:
- `ai:chat` — bot response
- `ai:suggestions` — smart reply
- `ai:moderation` — content analysis result

---

### 8. User Toggle for AI Features

**Decision**: Store user preference per feature in MongoDB (User schema or separate AIUserSettings collection)

**Rationale**:
- Persistent per-user settings (survives browser close)
- Can be changed at runtime without redeploy
- Default: all features ON
- Stored in MongoDB for consistency across devices

---

### 9. AI Service Timeout Strategy

**Decision**: 30s for chat responses, 5s for moderation, 10s for suggestions

**Rationale**:
- Chat responses need more time for quality (SC-001: 90% under 10s target)
- Moderation should be fast to not delay message display (5s max)
- Suggestions are pre-computed, can have medium timeout (10s)

---

### 10. Graceful Degradation

**Decision**: All AI features are non-blocking; chat always succeeds regardless of AI state

**Rationale**:
- FR-010: AI failure never blocks message sending
- Wrap all AI calls in try-catch with fallback
- Frontend shows subtle indicator when AI features unavailable (not blocking toast)
- Backend logs AI errors for monitoring but doesn't propagate to client as blocking error

---

## Unresolved Questions (Resolved)

| Question | Resolution |
|----------|-----------|
| Which Gemini SDK? | `@google/generative-ai` — official Google SDK |
| How to rotate API keys? | Round-robin with 429 detection |
| Moderation approach? | Prompt-based via Gemini (no dedicated API) |
| Smart reply format? | JSON array via structured output |
| Context size? | Last 10 messages, truncate if needed |
| AI events namespace? | `/ai` Socket.IO namespace |
| Feature toggle storage? | MongoDB per-user settings |
