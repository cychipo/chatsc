# Implementation Plan: Gemini AI Chat Integration

**Branch**: `014-gemini-ai-chat` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-gemini-ai-chat/spec.md`

## Summary

Tích hợp 3 tính năng AI vào hệ thống chat Socket.IO hiện có: (1) AI Chat Bot tự động trả lời khi @mention hoặc dùng lệnh `/ai`, (2) Smart Reply Suggestions — 3 gợi ý trả lời nhanh, (3) Content Moderation & Sentiment Detection — phát hiện toxic content và phân tích sentiment. Sử dụng Gemini LLM với cơ chế rotate nhiều API keys và models để tránh rate limit.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Socket.IO, @google/generative-ai SDK
**Storage**: MongoDB (conversation/message schemas đã có, thêm AIConfig schema mới)
**Testing**: Vitest, React Testing Library
**Target Platform**: Linux server (VPS deployment)
**Project Type**: Web application (frontend + backend)
**Performance Goals**:
- AI response < 10s (SC-001)
- Suggestions appear < 1s (SC-003)
- Auto-recovery from rate limits 99% (SC-002)
**Constraints**:
- Graceful degradation when AI unavailable (FR-010)
- 30s timeout per AI request (FR-011)
- Max 10 messages context (FR-012)
- No hard-coded API keys (FR-013)
**Scale/Scope**: Hỗ trợ nhiều concurrent users, mỗi user có thể toggle AI features riêng biệt

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a template (empty) — no gates to enforce. Feature is a new module integration into existing web app, compliant with current project conventions.

**Post-Design Verification**:
- TypeScript throughout (matches existing codebase) ✓
- NestJS module pattern (matches existing backend structure) ✓
- React + Zustand state management (matches existing frontend) ✓
- MongoDB schemas with Mongoose (matches existing data layer) ✓
- Vitest + RTL testing (matches existing test setup) ✓
- All new dependencies use existing patterns (services in modules/, components in features/) ✓

## Project Structure

### Documentation (this feature)

```text
specs/014-gemini-ai-chat/
├── plan.md              # This file
├── research.md           # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── socket-events.md
│   └── ai-service.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/src/
├── config/
│   └── env.config.ts            # Extended with AI env vars
├── modules/
│   ├── ai/
│   │   ├── ai.module.ts         # NestJS module
│   │   ├── ai.service.ts        # Core AI logic (rotation, calls)
│   │   ├── ai-chatbot.service.ts    # Bot response logic
│   │   ├── ai-suggestions.service.ts # Smart reply logic
│   │   ├── ai-moderation.service.ts  # Sentiment/toxicity
│   │   ├── ai-config.service.ts  # Config loading from env
│   │   ├── dto/
│   │   │   ├── gemini-request.dto.ts
│   │   │   └── moderation-result.dto.ts
│   │   └── schemas/
│   │       └── ai-config.schema.ts   # AIConfig entity
│   └── chat/
│       ├── chat.gateway.ts       # Extended with AI events
│       └── chat.service.ts       # Extended with AI integration
frontend/src/
├── features/chat/
│   ├── components/
│   │   ├── smart-reply-suggestions.tsx  # P2: Smart reply UI
│   │   └── message-moderation.tsx       # P3: Moderation display
│   └── chat.page.tsx             # Extended with AI features
├── services/
│   └── ai.service.ts             # Frontend AI API calls
├── store/
│   └── chat.store.ts             # Extended with AI state
└── .env.example                  # Extended with AI env vars
tests/
├── unit/
│   └── ai/
│       ├── ai.service.test.ts
│       ├── ai-chatbot.service.test.ts
│       ├── ai-suggestions.service.test.ts
│       └── ai-moderation.service.test.ts
└── integration/
    └── ai-chatbot.integration.test.ts
```

**Structure Decision**: Thêm module `ai/` trong backend/src/modules/ để giữ AI logic tách biệt, mở rộng chat.gateway.ts để handle AI Socket.IO events. Frontend thêm components mới trong features/chat/components/.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| N/A | No violations | — |
