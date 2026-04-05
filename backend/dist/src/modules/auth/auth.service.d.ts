import { JwtPayload } from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { AuthAttemptDocument } from './schemas/auth-attempt.schema';
import { RefreshSessionDocument } from './schemas/refresh-session.schema';
import { User, UserDocument } from './schemas/user.schema';
import { SessionUser } from './types/auth-session';
import { AccessTokenPayload, RefreshSessionResponse } from './types/token-payload';
export type GoogleAuthUser = {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
};
type RefreshTokenPayload = {
    type: 'refresh';
    sub: string;
    sid: string;
    jti: string;
};
export declare class AuthService {
    private readonly userModel;
    private readonly authAttemptModel;
    private readonly refreshSessionModel;
    constructor(userModel: Model<UserDocument>, authAttemptModel: Model<AuthAttemptDocument>, refreshSessionModel: Model<RefreshSessionDocument>);
    findById(id: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    } | null>;
    findByEmail(email: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    searchUsers(query: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    }[]>;
    upsertGoogleUser(payload: GoogleAuthUser): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    }>;
    issueTokenPair(user: SessionUser, createdBy?: string): Promise<RefreshSessionResponse & {
        refreshToken: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<RefreshSessionResponse>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    authenticateAccessToken(token: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string | undefined;
    } | null>;
    verifyAccessToken(token: string): (AccessTokenPayload & JwtPayload) | null;
    verifyRefreshToken(token: string): RefreshTokenPayload & JwtPayload;
    recordAttempt(payload: {
        provider?: string;
        emailCandidate?: string;
        result: string;
        failureReason?: string;
        userId?: string;
        sessionId?: string;
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
    private buildRefreshSessionResponse;
    private signAccessToken;
    private signRefreshToken;
    private hashToken;
}
export {};
