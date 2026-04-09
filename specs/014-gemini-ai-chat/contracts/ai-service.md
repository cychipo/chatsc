# AI Service Contracts

## 1. Gemini API Contract

### Chat Generation

**Endpoint**: `POST /v1beta/models/{model}:generateContent`

**Request**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello, how are you?" }]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "maxOutputTokens": 2048,
    "topP": 1.0,
    "topK": 40
  },
  "safetySettings": [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
  ]
}
```

**Response** (success):
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "I'm doing well, thank you for asking!" }],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ]
}
```

**Response** (rate limited — 429):
```json
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota).",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

---

### Structured Output (Moderation & Suggestions)

**Request**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Analyze this message: 'Hello, how are you today?'" }]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": {
      "type": "object",
      "properties": {
        "sentiment": {
          "type": "string",
          "enum": ["positive", "neutral", "negative"]
        },
        "sentimentScore": { "type": "number" },
        "toxicityScore": { "type": "number" },
        "isToxic": { "type": "boolean" }
      }
    }
  }
}
```

**Response**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"sentiment\": \"positive\", \"sentimentScore\": 0.8, \"toxicityScore\": 0.0, \"isToxic\": false}"
          }
        ]
      }
    }
  ]
}
```

---

## 2. Internal AI Service Contract

### AIService Interface

```typescript
interface AIService {
  // P1: AI Chat Bot
  generateChatResponse(
    conversationId: string,
    userMessage: string,
    contextMessages: ChatMessage[]
  ): Promise<string>

  // P2: Smart Reply
  generateSuggestions(
    conversationId: string,
    lastMessage: string
  ): Promise<[string, string, string]>

  // P3: Content Moderation
  analyzeMessage(messageId: string, text: string): Promise<ModerationResult>

  // Rotation
  rotateApiKey(): void
  rotateModel(): void
  getCurrentKeyIndex(): number
  getCurrentModelIndex(): number
}
```

---

## 3. Env Variables Contract

```bash
# Gemini API Keys (comma-separated, no spaces)
GEMINI_API_KEYS=key1,key2,key3

# Gemini Models (comma-separated, no spaces, order matches rotation)
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

---

## 4. Rate Limit Handling Contract

```typescript
// On 429 or 403 error from Gemini API:
interface RateLimitAction {
  action: 'rotate_key' | 'rotate_model' | 'skip_and_notify' | 'retry_after'
  nextKeyIndex?: number
  nextModelIndex?: number
  retryAfterSeconds?: number
}

// Decision tree:
// 1. If key is rate-limited → rotate to next key
// 2. If all keys rate-limited → try rotating model
// 3. If all combinations exhausted → skip request, notify client
// 4. If specific retry-after header → wait and retry
```
