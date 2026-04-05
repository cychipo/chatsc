import { SessionUser } from '../auth/types/auth-session';
import { ChatService } from './chat.service';
import { CreateConversationDto, AddMemberDto, GetMessagesQueryDto } from './dto/chat.dto';
type AuthenticatedRequest = Request & {
    user?: SessionUser;
    body: Buffer;
};
type ChatApiResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: {
        code: string;
        message: string;
    };
};
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getStatus(request: AuthenticatedRequest): ChatApiResponse<{
        feature: string;
        status: string;
        user: SessionUser | undefined;
    }>;
    listConversations(req: AuthenticatedRequest): Promise<ChatApiResponse<{
        _id: string;
        type: "direct" | "group";
        title?: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        lastMessageAt?: string;
        displayTitle: string;
        displayAvatarUrl?: string;
        lastMessagePreview?: string;
        directPeer?: SessionUser;
    }[]>>;
    createConversation(req: AuthenticatedRequest, dto: CreateConversationDto): Promise<ChatApiResponse<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/conversation.schema").Conversation, {}, {}> & import("./schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/conversation.schema").Conversation, {}, {}> & import("./schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/conversation.schema").Conversation, {}, {}> & import("./schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)>>;
    getMessages(req: AuthenticatedRequest, conversationId: string, query: GetMessagesQueryDto): Promise<ChatApiResponse<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/message.schema").Message, {}, {}> & import("./schemas/message.schema").Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>>;
    sendMessage(req: AuthenticatedRequest, conversationId: string): Promise<ChatApiResponse<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/message.schema").Message, {}, {}> & import("./schemas/message.schema").Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/message.schema").Message, {}, {}> & import("./schemas/message.schema").Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>>;
    addMember(req: AuthenticatedRequest, conversationId: string, dto: AddMemberDto): Promise<ChatApiResponse<{
        alreadyMember: boolean;
    }>>;
    removeMember(req: AuthenticatedRequest, conversationId: string, userId: string): Promise<ChatApiResponse<{
        removed: boolean;
    }>>;
    leaveConversation(req: AuthenticatedRequest, conversationId: string): Promise<ChatApiResponse<{
        left: boolean;
    }>>;
    deleteConversation(req: AuthenticatedRequest, conversationId: string): Promise<ChatApiResponse<{
        deleted: boolean;
    }>>;
    getMembershipEvents(req: AuthenticatedRequest, conversationId: string): Promise<ChatApiResponse<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/membership-event.schema").MembershipEvent, {}, {}> & import("./schemas/membership-event.schema").MembershipEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>>;
}
export {};
