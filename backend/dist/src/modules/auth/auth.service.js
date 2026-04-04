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
const mongoose_2 = require("mongoose");
const auth_attempt_schema_1 = require("./schemas/auth-attempt.schema");
const user_schema_1 = require("./schemas/user.schema");
const username_util_1 = require("./utils/username.util");
let AuthService = class AuthService {
    constructor(userModel, authAttemptModel) {
        this.userModel = userModel;
        this.authAttemptModel = authAttemptModel;
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
    async recordAttempt(payload) {
        await this.authAttemptModel.create({
            provider: payload.provider ?? 'google',
            emailCandidate: payload.emailCandidate,
            result: payload.result,
            failureReason: payload.failureReason,
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(auth_attempt_schema_1.AuthAttempt.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map