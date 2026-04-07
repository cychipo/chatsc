# Research: Chat UI Controls

## Decision 1: Keep the sidebar toggle as frontend-only layout state in the existing chat page
- **Decision**: Implement the menu button as a local UI state toggle in the existing chat page and switch between expanded and collapsed sidebar layouts without introducing backend changes.
- **Rationale**: The current chat screen already renders both sidebar and main thread in one page and the menu button is present but unused in [frontend/src/features/chat/chat.page.tsx](../../frontend/src/features/chat/chat.page.tsx). This is a pure presentation change and should not expand scope into persistence or server contracts.
- **Alternatives considered**:
  - Persist sidebar state per user: rejected because the spec only requires immediate toggle behavior, not preference storage.
  - Create a separate responsive layout wrapper: rejected because the current page already owns the chat layout and can absorb the change directly.

## Decision 2: Implement in-conversation search as a dedicated HTTP search endpoint plus modal popup
- **Decision**: Add a conversation-scoped message search endpoint in the chat module and open an Ant Design modal from the existing search button to query matching messages in the active conversation.
- **Rationale**: There is no existing message search endpoint in the chat module, while the frontend already has an established modal and debounced search pattern for “New Chat” in [frontend/src/features/chat/chat.page.tsx](../../frontend/src/features/chat/chat.page.tsx). A small REST addition keeps the feature simple and consistent with current chat data loading.
- **Alternatives considered**:
  - Search only within currently loaded messages on the client: rejected because the thread is paginated and would miss older matches.
  - Use realtime socket search events: rejected because search is request/response behavior, not live presence data.

## Decision 3: Reuse the auth user-search regex pattern for message text search
- **Decision**: Implement backend message search using the same escaped case-insensitive regex approach already used by auth user search, scoped to one conversation and limited to a bounded result set.
- **Rationale**: The auth module already demonstrates a safe regex-search pattern, and chat messages are stored in a way that the service can already convert them through the existing display mapping flow. This is the smallest consistent way to introduce search without adding new infrastructure.
- **Alternatives considered**:
  - Add a MongoDB text index immediately: rejected for now because the spec does not require global search scale and conversation scope reduces the query size.
  - Build a separate search service: rejected as unnecessary complexity.

## Decision 4: Reuse existing avatar sources and fallback conventions for message items
- **Decision**: Render message sender avatars from the existing authenticated user / direct peer avatar data already exposed by current chat summaries, with a default avatar placeholder when no image is available.
- **Rationale**: The conversation list already uses avatar images or a title initial fallback in [frontend/src/features/chat/components/conversation-list.tsx](../../frontend/src/features/chat/components/conversation-list.tsx), while message bubbles still render a generic icon in [frontend/src/features/chat/components/message-bubble.tsx](../../frontend/src/features/chat/components/message-bubble.tsx). Aligning these patterns improves consistency with minimal change.
- **Alternatives considered**:
  - Keep generic icons for some message cases: rejected because it would fail the spec’s requirement to show avatars instead of icons.
  - Introduce a brand-new avatar abstraction layer: rejected because existing components already provide enough patterns.

## Decision 5: Extend message payloads with minimal sender presentation metadata for rendering and search results
- **Decision**: Extend chat message payloads returned by the backend so the frontend has the sender name and avatar source needed to render conversation bubbles and search results without extra user lookups.
- **Rationale**: Current message payloads expose senderId and content but not sender presentation data, so the page currently falls back to a conversation-level display name for non-self messages. Search results and message avatars both need sender-specific presentation data to remain accurate, especially in group timelines.
- **Alternatives considered**:
  - Have the frontend derive all sender details from conversation-level data: rejected because that is insufficient for message-level accuracy in multi-participant conversations.
  - Add a follow-up user-fetch per result: rejected because it adds latency and unnecessary coupling.

## Decision 6: Cover the feature primarily with frontend component/integration tests and targeted backend contract additions
- **Decision**: Add focused frontend tests around sidebar state, search popup behavior, and avatar rendering, while treating the new backend search route and expanded message payload as contract changes validated through the existing chat module structure.
- **Rationale**: The repository already has Vitest + React Testing Library coverage for chat layout and message bubble rendering in [frontend/src/test/](../../frontend/src/test/). The feature is centered on chat UI behavior, so the highest-value automated coverage sits in frontend interaction tests.
- **Alternatives considered**:
  - Rely only on manual verification: rejected because button behavior and modal states are easy to regress.
  - Add a large new end-to-end harness: rejected because it would exceed the feature scope.