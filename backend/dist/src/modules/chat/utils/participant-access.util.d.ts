import { ChatService } from '../chat.service';
export declare function requireActiveParticipant(chatService: ChatService, conversationId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../schemas/conversation-participant.schema").ConversationParticipant, {}, {}> & import("../schemas/conversation-participant.schema").ConversationParticipant & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {}, {}> & import("mongoose").Document<unknown, {}, import("../schemas/conversation-participant.schema").ConversationParticipant, {}, {}> & import("../schemas/conversation-participant.schema").ConversationParticipant & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & Required<{
    _id: import("mongoose").Types.ObjectId;
}>>;
export declare function requireAdminOrOwner(chatService: ChatService, conversationId: string, userId: string): Promise<"admin" | "owner">;
