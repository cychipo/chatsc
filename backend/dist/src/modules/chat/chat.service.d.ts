import { Model, Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { SessionUser } from '../auth/types/auth-session';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { ConversationParticipant, ConversationParticipantDocument } from './schemas/conversation-participant.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { MembershipEvent, MembershipEventDocument } from './schemas/membership-event.schema';
type ConversationSummary = {
    _id: string;
    type: 'direct' | 'group';
    title?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    displayTitle: string;
    displayAvatarUrl?: string;
    lastMessagePreview?: string;
    directPeer?: SessionUser;
};
export declare class ChatService {
    private conversationModel;
    private participantModel;
    private messageModel;
    private membershipEventModel;
    private authService;
    constructor(conversationModel: Model<ConversationDocument>, participantModel: Model<ConversationParticipantDocument>, messageModel: Model<MessageDocument>, membershipEventModel: Model<MembershipEventDocument>, authService: AuthService);
    listConversationsForUser(userId: string): Promise<ConversationSummary[]>;
    createConversation(type: 'direct' | 'group', creatorId: string, participantIds: string[], title?: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Conversation, {}, {}> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Conversation, {}, {}> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>) | (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Conversation, {}, {}> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)>;
    getActiveParticipant(conversationId: string, userId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, ConversationParticipant, {}, {}> & ConversationParticipant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, ConversationParticipant, {}, {}> & ConversationParticipant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    findDirectConversation(userAId: string, userBId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Conversation, {}, {}> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    sendMessage(conversationId: string, senderId: string, content: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getMessages(conversationId: string, before?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    addMember(conversationId: string, userId: string, actorId: string): Promise<{
        alreadyMember: boolean;
    }>;
    removeMember(conversationId: string, userId: string, actorId: string): Promise<void>;
    leaveConversation(conversationId: string, userId: string): Promise<void>;
    deleteConversationForUser(conversationId: string, userId: string): Promise<void>;
    private markConversationLeft;
    getMembershipEvents(conversationId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, MembershipEvent, {}, {}> & MembershipEvent & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    getParticipantRole(conversationId: string, userId: string): Promise<import("./schemas/conversation-participant.schema").ParticipantRole | undefined>;
    getActiveParticipants(conversationId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, ConversationParticipant, {}, {}> & ConversationParticipant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
}
export {};
