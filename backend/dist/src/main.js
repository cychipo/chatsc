"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_config_1 = require("./config/env.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    const env = (0, env_config_1.backendEnv)();
    app.use((req, res, next) => {
        if (req.method === 'POST' &&
            req.url.match(/\/chat\/conversations\/[^/]+\/messages/) &&
            req.headers['content-type'] === 'application/octet-stream') {
            express_1.default.raw({ type: 'application/octet-stream', limit: '1mb' })(req, res, next);
        }
        else {
            express_1.default.json({ limit: '1mb' })(req, res, next);
        }
    });
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
            secure: false,
        },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    await app.listen(env.PORT);
}
void bootstrap();
//# sourceMappingURL=main.js.map