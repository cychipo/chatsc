import { HydratedDocument } from 'mongoose';
export type AuthAttemptDocument = HydratedDocument<AuthAttempt>;
export declare class AuthAttempt {
    provider: string;
    emailCandidate?: string;
    result: 'started' | 'cancelled' | 'failed' | 'succeeded';
    failureReason?: string;
}
export declare const AuthAttemptSchema: import("mongoose").Schema<AuthAttempt, import("mongoose").Model<AuthAttempt, any, any, any, import("mongoose").Document<unknown, any, AuthAttempt, any, {}> & AuthAttempt & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuthAttempt, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AuthAttempt>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuthAttempt> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
