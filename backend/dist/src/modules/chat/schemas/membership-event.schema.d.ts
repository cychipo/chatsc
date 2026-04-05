import { HydratedDocument, Types } from 'mongoose';
export type MembershipEventDocument = HydratedDocument<MembershipEvent>;
export type MembershipEventType = 'added' | 'joined' | 'left' | 'removed';
export declare class MembershipEvent {
    conversationId: Types.ObjectId;
    type: MembershipEventType;
    targetUserId: Types.ObjectId;
    actorUserId?: Types.ObjectId;
    occurredAt: Date;
    metadata?: Record<string, unknown>;
}
export declare const MembershipEventSchema: import("mongoose").Schema<MembershipEvent, import("mongoose").Model<MembershipEvent, any, any, any, import("mongoose").Document<unknown, any, MembershipEvent, any, {}> & MembershipEvent & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MembershipEvent, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<MembershipEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MembershipEvent> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
