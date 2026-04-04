"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_config_1 = require("./config/env.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const env = (0, env_config_1.backendEnv)();
    app.setGlobalPrefix(env.API_PREFIX);
    app.enableCors({
        origin: process.env.FRONTEND_APP_URL ?? 'http://localhost:5173',
        credentials: true,
    });
    app.use((0, express_session_1.default)({
        secret: process.env.SESSION_SECRET ?? 'replace-with-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
        },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    await app.listen(env.PORT);
}
void bootstrap();
//# sourceMappingURL=main.js.map