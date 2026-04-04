import { Model } from 'mongoose';
import { AuthAttemptDocument } from './schemas/auth-attempt.schema';
import { User, UserDocument } from './schemas/user.schema';
export type GoogleAuthUser = {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
};
export declare class AuthService {
    private readonly userModel;
    private readonly authAttemptModel;
    constructor(userModel: Model<UserDocument>, authAttemptModel: Model<AuthAttemptDocument>);
    findById(id: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    } | null>;
    findByEmail(email: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    upsertGoogleUser(payload: GoogleAuthUser): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    }>;
    recordAttempt(payload: {
        provider?: string;
        emailCandidate?: string;
        result: 'started' | 'cancelled' | 'failed' | 'succeeded';
        failureReason?: string;
    }): Promise<void>;
    toSessionUser(user: {
        email: string;
        username: string;
        displayName: string;
        avatarUrl?: string;
        id?: string;
        _id?: {
            toString(): string;
        };
    }): {
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    };
}
