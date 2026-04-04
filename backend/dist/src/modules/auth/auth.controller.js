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
const auth_service_1 = require("./auth.service");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const session_auth_guard_1 = require("./guards/session-auth.guard");
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
        request.session.user = oauthUser;
        await this.authService.recordAttempt({
            result: 'succeeded',
            emailCandidate: oauthUser.email,
        });
        return response.redirect(this.buildFrontendRedirect());
    }
    async handleGoogleFailure(response) {
        await this.authService.recordAttempt({ result: 'cancelled', failureReason: 'google-auth-cancelled' });
        return response.redirect(this.buildFrontendRedirect('google_auth_cancelled'));
    }
    getCurrentUser(request) {
        return {
            user: request.session.user,
        };
    }
    async logout(request) {
        await new Promise((resolve, reject) => {
            request.session.destroy((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
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
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
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