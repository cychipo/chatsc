"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const auth_serializer_1 = require("./auth.serializer");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const session_auth_guard_1 = require("./guards/session-auth.guard");
const access_token_auth_guard_1 = require("./guards/access-token-auth.guard");
const auth_attempt_schema_1 = require("./schemas/auth-attempt.schema");
const refresh_session_schema_1 = require("./schemas/refresh-session.schema");
const user_schema_1 = require("./schemas/user.schema");
const google_strategy_1 = require("./strategies/google.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ session: true }),
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: auth_attempt_schema_1.AuthAttempt.name, schema: auth_attempt_schema_1.AuthAttemptSchema },
                { name: refresh_session_schema_1.RefreshSession.name, schema: refresh_session_schema_1.RefreshSessionSchema },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, auth_serializer_1.AuthSerializer, google_strategy_1.GoogleStrategy, google_auth_guard_1.GoogleAuthGuard, session_auth_guard_1.SessionAuthGuard, access_token_auth_guard_1.AccessTokenAuthGuard],
        exports: [auth_service_1.AuthService, access_token_auth_guard_1.AccessTokenAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map