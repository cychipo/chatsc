import { HydratedDocument, Types } from 'mongoose';
export type RefreshSessionDocument = HydratedDocument<RefreshSession>;
export declare class RefreshSession {
    userId: Types.ObjectId;
    tokenHash: string;
    issuedAt: Date;
    expiresAt: Date;
    lastUsedAt?: Date;
    revokedAt?: Date;
    status: 'active' | 'expired' | 'revoked';
    createdBy: string;
}
export declare const RefreshSessionSchema: import("mongoose").Schema<RefreshSession, import("mongoose").Model<RefreshSession, any, any, any, import("mongoose").Document<unknown, any, RefreshSession, any, {}> & RefreshSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RefreshSession, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RefreshSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<RefreshSession> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
