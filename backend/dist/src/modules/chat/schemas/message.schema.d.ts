import { HydratedDocument, Types } from 'mongoose';
export type MessageDocument = HydratedDocument<Message>;
export type DeliveryStatus = 'sent' | 'failed';
export declare class Message {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
    sentAt: Date;
    deliveryStatus: DeliveryStatus;
    decodeErrorCode?: string;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, import("mongoose").Document<unknown, any, Message, any, {}> & Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Message> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
