import { HydratedDocument, Types } from 'mongoose';
export type ConversationDocument = HydratedDocument<Conversation>;
export type ConversationType = 'direct' | 'group';
export declare class Conversation {
    type: ConversationType;
    title?: string;
    createdBy: Types.ObjectId;
    lastMessageAt?: Date;
}
export declare const ConversationSchema: import("mongoose").Schema<Conversation, import("mongoose").Model<Conversation, any, any, any, import("mongoose").Document<unknown, any, Conversation, any, {}> & Conversation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Conversation, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Conversation>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Conversation> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
