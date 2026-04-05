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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const env_config_1 = require("../../config/env.config");
const auth_service_1 = require("./auth.service");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const access_token_auth_guard_1 = require("./guards/access-token-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async startGoogleLogin() {
        await this.authService.recordAttempt({ result: 'started' });
    }
    async handleGoogleCallback(request, response) {
        const oauthUser = request.user;
        if (!oauthUser) {
            await this.authService.recordAttempt({ result: 'failed', failureReason: 'missing-oauth-user' });
            return response.redirect(this.buildFrontendRedirect('oauth_failed'));
        }
        if (request.session) {
            request.session.user = oauthUser;
        }
        const issuedSession = await this.authService.issueTokenPair(oauthUser);
        this.setRefreshCookie(response, issuedSession.refreshToken);
        await this.authService.recordAttempt({
            result: 'succeeded',
            emailCandidate: oauthUser.email,
            userId: oauthUser.id,
        });
        return response.redirect(this.buildFrontendRedirect());
    }
    async handleGoogleFailure(response) {
        await this.authService.recordAttempt({ result: 'cancelled', failureReason: 'google-auth-cancelled' });
        return response.redirect(this.buildFrontendRedirect('google_auth_cancelled'));
    }
    getCurrentUser(request) {
        return {
            user: request.user,
        };
    }
    async searchUsers(request, query) {
        return {
            success: true,
            data: await this.authService.searchUsers(query ?? '', request.user.id),
        };
    }
    async refresh(request, response) {
        const refreshToken = this.getRefreshTokenFromRequest(request);
        if (!refreshToken) {
            throw new common_1.UnauthorizedException({ code: 'refresh_token_missing', message: 'Refresh token is required' });
        }
        try {
            return await this.authService.refreshAccessToken(refreshToken);
        }
        catch (error) {
            this.clearRefreshCookie(response);
            throw error;
        }
    }
    async logout(request, response) {
        const refreshToken = this.getRefreshTokenFromRequest(request);
        if (refreshToken) {
            await this.authService.revokeRefreshToken(refreshToken);
        }
        this.clearRefreshCookie(response);
        if (request.session?.destroy) {
            await new Promise((resolve, reject) => {
                request.session?.destroy?.((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }
        return {
            success: true,
        };
    }
    getStatus() {
        return {
            feature: 'auth',
            status: 'ready',
        };
    }
    buildFrontendRedirect(error) {
        const frontendUrl = process.env.FRONTEND_APP_URL ?? 'http://localhost:5173';
        if (!error) {
            return frontendUrl;
        }
        const url = new URL(frontendUrl);
        url.searchParams.set('authError', error);
        return url.toString();
    }
    getRefreshTokenFromRequest(request) {
        const env = (0, env_config_1.backendEnv)();
        const cookieHeader = request.headers.cookie;
        if (!cookieHeader) {
            return null;
        }
        const cookieParts = cookieHeader.split(';').map((part) => part.trim());
        const cookieValue = cookieParts.find((part) => part.startsWith(`${env.REFRESH_COOKIE_NAME}=`));
        if (!cookieValue) {
            return null;
        }
        return decodeURIComponent(cookieValue.slice(env.REFRESH_COOKIE_NAME.length + 1));
    }
    setRefreshCookie(response, refreshToken) {
        const env = (0, env_config_1.backendEnv)();
        response.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
            path: '/',
        });
    }
    clearRefreshCookie(response) {
        const env = (0, env_config_1.backendEnv)();
        response.clearCookie(env.REFRESH_COOKIE_NAME, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "startGoogleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleGoogleCallback", null);
__decorate([
    (0, common_1.Get)('google/failure'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleGoogleFailure", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(access_token_auth_guard_1.AccessTokenAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)('users/search'),
    (0, common_1.UseGuards)(access_token_auth_guard_1.AccessTokenAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getStatus", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map