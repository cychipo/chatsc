# Quickstart: Chat UI Controls

## Goal
Verify the chat UI supports in-conversation message search and sender avatars in the message thread.

## Setup
1. Start backend and frontend with the current workspace commands.
2. Log in with at least one account that has direct and group conversations with existing messages.
3. Prefer one conversation with messages from multiple participants and mixed avatar availability.
4. Prefer one conversation whose messages are stored with reverse encryption enabled so search can be verified against readable content.

## Scenario 1: Search messages in the active conversation
1. Open a conversation with known message content.
2. Click the search button in the chat header.
3. Confirm a search popup opens for the current conversation.
4. Enter a term known to exist in that conversation.
5. Confirm matching messages appear with sender and timestamp context.
6. Search with a term that does not exist.
7. Confirm the popup shows a clear empty state.
8. Close the popup.
9. Confirm the conversation view remains unchanged.

## Scenario 2: Prevent irrelevant search flow
1. Navigate to the chat screen without an active conversation selected, if that state is available.
2. Press the search button.
3. Confirm the UI prevents or clearly explains why conversation search cannot proceed.

## Scenario 3: Show sender avatars in message thread
1. Open a direct conversation where the other user has an avatar image.
2. Confirm incoming messages display that avatar instead of the generic icon.
3. Open a conversation where at least one sender has no avatar image.
4. Confirm those messages display a default avatar placeholder.
5. Scan consecutive messages from different senders.
6. Confirm avatar differences make it easier to distinguish participants.

## Suggested automated checks
- Frontend test for opening and closing the search popup.
- Frontend test for rendering search results and empty state.
- Frontend test for message bubble avatar rendering with image and fallback cases.
- Backend test or service-level verification for conversation-scoped search authorization, encrypted-content matching, and result shaping.