# Data Model: Chat Groups

## Conversation
- **Fields**
  - `id: ObjectId`
  - `type: 'direct' | 'group'`
  - `title?: string` (bắt buộc với group, optional với direct)
  - `createdBy: ObjectId<User>`
  - `createdAt: Date`
  - `updatedAt: Date`
  - `lastMessageAt?: Date`
- **Validation**
  - `type=direct` phải có đúng 2 thành viên hoạt động.
  - `type=group` phải có >= 1 thành viên hoạt động.

## ConversationParticipant
- **Fields**
  - `id: ObjectId`
  - `conversationId: ObjectId<Conversation>`
  - `userId: ObjectId<User>`
  - `role: 'member' | 'admin' | 'owner'`
  - `status: 'active' | 'left' | 'removed'`
  - `addedBy?: ObjectId<User>`
  - `joinedAt: Date`
  - `leftAt?: Date`
- **Validation**
  - Unique active membership theo (`conversationId`, `userId`, `status=active`).
  - `removed` phải có actor hợp lệ ở event tương ứng.

## Message
- **Fields**
  - `id: ObjectId`
  - `conversationId: ObjectId<Conversation>`
  - `senderId: ObjectId<User>`
  - `content: string` (đã decode từ binary)
  - `sentAt: Date`
  - `deliveryStatus: 'sent' | 'failed'`
  - `decodeErrorCode?: string`
- **Validation**
  - Người gửi phải là participant `active` tại thời điểm gửi.
  - `content` không rỗng sau decode.

## MembershipEvent
- **Fields**
  - `id: ObjectId`
  - `conversationId: ObjectId<Conversation>`
  - `type: 'added' | 'joined' | 'left' | 'removed'`
  - `targetUserId: ObjectId<User>`
  - `actorUserId?: ObjectId<User>`
  - `occurredAt: Date`
  - `metadata?: Record<string, unknown>`
- **Validation**
  - `added/removed` yêu cầu `actorUserId`.
  - Event là immutable, chỉ append.

## Relationships
- `Conversation 1 - n ConversationParticipant`
- `Conversation 1 - n Message`
- `Conversation 1 - n MembershipEvent`
- `User 1 - n Message`
- `User 1 - n ConversationParticipant`

## State transitions

### Participant status
- `active -> left` (self leave)
- `active -> removed` (admin/owner remove)
- `left/removed -> active` (được add lại, tạo event mới)

### Membership events
- add member: append `added`
- self leave: append `left`
- remove member: append `removed`

### Message flow
1. FE encode UTF-8 text -> binary (`ArrayBuffer`)
2. BE decode binary -> text
3. Validate membership + persist message
4. Forward luồng xử lý chat hiện tại (Linux kernel pipeline)
5. Emit message cho người nhận/nhóm
