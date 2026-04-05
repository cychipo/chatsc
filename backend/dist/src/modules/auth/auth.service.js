"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jsonwebtoken_1 = require("jsonwebtoken");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const env_config_1 = require("../../config/env.config");
const auth_attempt_schema_1 = require("./schemas/auth-attempt.schema");
const refresh_session_schema_1 = require("./schemas/refresh-session.schema");
const user_schema_1 = require("./schemas/user.schema");
const username_util_1 = require("./utils/username.util");
let AuthService = class AuthService {
    constructor(userModel, authAttemptModel, refreshSessionModel) {
        this.userModel = userModel;
        this.authAttemptModel = authAttemptModel;
        this.refreshSessionModel = refreshSessionModel;
    }
    async findById(id) {
        const user = await this.userModel.findById(id).lean();
        if (!user) {
            return null;
        }
        return this.toSessionUser(user);
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).lean();
    }
    async searchUsers(query, currentUserId) {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 2) {
            return [];
        }
        const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedQuery, 'i');
        const users = await this.userModel
            .find({
            _id: { $ne: new mongoose_2.Types.ObjectId(currentUserId) },
            $or: [
                { email: searchRegex },
                { username: searchRegex },
                { displayName: searchRegex },
            ],
        })
            .sort({ username: 1 })
            .limit(10)
            .lean();
        return users.map((user) => this.toSessionUser(user));
    }
    async upsertGoogleUser(payload) {
        const existingUser = await this.userModel.findOne({ email: payload.email });
        if (existingUser) {
            existingUser.googleId = payload.googleId;
            existingUser.displayName = payload.displayName;
            existingUser.avatarUrl = payload.avatarUrl;
            await existingUser.save();
            return this.toSessionUser(existingUser.toObject());
        }
        const baseUsername = (0, username_util_1.deriveBaseUsername)(payload.email);
        const username = await (0, username_util_1.resolveUsernameCollision)(baseUsername, async (candidate) => {
            const user = await this.userModel.exists({ username: candidate });
            return Boolean(user);
        });
        const createdUser = await this.userModel.create({
            googleId: payload.googleId,
            email: payload.email,
            username,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
            status: 'active',
        });
        return this.toSessionUser(createdUser.toObject());
    }
    async issueTokenPair(user, createdBy = 'google-login') {
        const env = (0, env_config_1.backendEnv)();
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
        const refreshSession = new this.refreshSessionModel({
            userId: new mongoose_2.Types.ObjectId(user.id),
            tokenHash: '',
            issuedAt,
            expiresAt,
            status: 'active',
            createdBy,
        });
        const refreshToken = this.signRefreshToken({
            type: 'refresh',
            sub: user.id,
            sid: refreshSession.id,
            jti: (0, crypto_1.randomUUID)(),
        });
        refreshSession.tokenHash = this.hashToken(refreshToken);
        await refreshSession.save();
        await this.recordAttempt({
            provider: 'refresh-token',
            result: 'issued',
            userId: user.id,
            sessionId: refreshSession.id,
        });
        return {
            refreshToken,
            ...this.buildRefreshSessionResponse(user, refreshSession.id),
        };
    }
    async refreshAccessToken(refreshToken) {
        const payload = this.verifyRefreshToken(refreshToken);
        const refreshSession = await this.refreshSessionModel.findById(payload.sid);
        if (!refreshSession) {
            await this.recordAttempt({
                provider: 'refresh-token',
                result: 'failed',
                failureReason: 'refresh-session-missing',
                userId: payload.sub,
                sessionId: payload.sid,
            });
            throw new common_1.UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' });
        }
        const now = new Date();
        if (refreshSession.tokenHash !== this.hashToken(refreshToken)) {
            await this.recordAttempt({
                provider: 'refresh-token',
                result: 'failed',
                failureReason: 'refresh-token-mismatch',
                userId: payload.sub,
                sessionId: payload.sid,
            });
            throw new common_1.UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' });
        }
        if (refreshSession.revokedAt || refreshSession.status === 'revoked') {
            await this.recordAttempt({
                provider: 'refresh-token',
                result: 'failed',
                failureReason: 'refresh-token-revoked',
                userId: payload.sub,
                sessionId: payload.sid,
            });
            throw new common_1.UnauthorizedException({ code: 'refresh_token_revoked', message: 'Refresh token has been revoked' });
        }
        if (refreshSession.expiresAt.getTime() <= now.getTime()) {
            refreshSession.status = 'expired';
            await refreshSession.save();
            await this.recordAttempt({
                provider: 'refresh-token',
                result: 'failed',
                failureReason: 'refresh-token-expired',
                userId: payload.sub,
                sessionId: payload.sid,
            });
            throw new common_1.UnauthorizedException({ code: 'refresh_token_expired', message: 'Refresh token has expired' });
        }
        const user = await this.findById(payload.sub);
        if (!user) {
            await this.recordAttempt({
                provider: 'refresh-token',
                result: 'failed',
                failureReason: 'refresh-user-missing',
                userId: payload.sub,
                sessionId: payload.sid,
            });
            throw new common_1.UnauthorizedException({ code: 'refresh_user_missing', message: 'User is no longer available' });
        }
        refreshSession.lastUsedAt = now;
        await refreshSession.save();
        await this.recordAttempt({
            provider: 'refresh-token',
            result: 'renewed',
            userId: user.id,
            sessionId: refreshSession.id,
        });
        return this.buildRefreshSessionResponse(user, refreshSession.id);
    }
    async revokeRefreshToken(refreshToken) {
        let payload;
        try {
            payload = this.verifyRefreshToken(refreshToken);
        }
        catch {
            return;
        }
        const refreshSession = await this.refreshSessionModel.findById(payload.sid);
        if (!refreshSession) {
            return;
        }
        refreshSession.revokedAt = new Date();
        refreshSession.status = 'revoked';
        await refreshSession.save();
        await this.recordAttempt({
            provider: 'refresh-token',
            result: 'revoked',
            userId: payload.sub,
            sessionId: payload.sid,
        });
    }
    async authenticateAccessToken(token) {
        const payload = this.verifyAccessToken(token);
        if (!payload) {
            return null;
        }
        const refreshSession = await this.refreshSessionModel.findById(payload.sid).lean();
        if (!refreshSession || refreshSession.status !== 'active' || refreshSession.revokedAt) {
            return null;
        }
        if (new Date(refreshSession.expiresAt).getTime() <= Date.now()) {
            return null;
        }
        return this.findById(payload.sub);
    }
    verifyAccessToken(token) {
        const env = (0, env_config_1.backendEnv)();
        try {
            return (0, jsonwebtoken_1.verify)(token, env.ACCESS_TOKEN_SECRET);
        }
        catch {
            return null;
        }
    }
    verifyRefreshToken(token) {
        const env = (0, env_config_1.backendEnv)();
        try {
            return (0, jsonwebtoken_1.verify)(token, env.REFRESH_TOKEN_SECRET);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                throw new common_1.UnauthorizedException({ code: 'refresh_token_expired', message: 'Refresh token has expired' });
            }
            throw new common_1.UnauthorizedException({ code: 'refresh_token_invalid', message: 'Refresh token is invalid' });
        }
    }
    async recordAttempt(payload) {
        await this.authAttemptModel.create({
            provider: payload.provider ?? 'google',
            emailCandidate: payload.emailCandidate,
            result: payload.result,
            failureReason: payload.failureReason,
            userId: payload.userId,
            sessionId: payload.sessionId,
        });
    }
    toSessionUser(user) {
        return {
            id: user.id ?? user._id?.toString() ?? '',
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        };
    }
    buildRefreshSessionResponse(user, sessionId) {
        const env = (0, env_config_1.backendEnv)();
        return {
            accessToken: this.signAccessToken({
                type: 'access',
                sub: user.id,
                sid: sessionId,
            }),
            user,
            expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
        };
    }
    signAccessToken(payload) {
        const env = (0, env_config_1.backendEnv)();
        return (0, jsonwebtoken_1.sign)(payload, env.ACCESS_TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
        });
    }
    signRefreshToken(payload) {
        const env = (0, env_config_1.backendEnv)();
        return (0, jsonwebtoken_1.sign)(payload, env.REFRESH_TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
        });
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(auth_attempt_schema_1.AuthAttempt.name)),
    __param(2, (0, mongoose_1.InjectModel)(refresh_session_schema_1.RefreshSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map