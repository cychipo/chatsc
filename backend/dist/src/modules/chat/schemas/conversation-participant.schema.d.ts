import { HydratedDocument, Types } from 'mongoose';
export type ConversationParticipantDocument = HydratedDocument<ConversationParticipant>;
export type ParticipantRole = 'member' | 'admin' | 'owner';
export type ParticipantStatus = 'active' | 'left' | 'removed';
export declare class ConversationParticipant {
    conversationId: Types.ObjectId;
    userId: Types.ObjectId;
    role: ParticipantRole;
    status: ParticipantStatus;
    addedBy?: Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
}
export declare const ConversationParticipantSchema: import("mongoose").Schema<ConversationParticipant, import("mongoose").Model<ConversationParticipant, any, any, any, import("mongoose").Document<unknown, any, ConversationParticipant, any, {}> & ConversationParticipant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ConversationParticipant, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ConversationParticipant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ConversationParticipant> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
