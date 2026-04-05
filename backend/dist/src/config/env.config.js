"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendEnv = void 0;
const backendEnv = () => ({
    PORT: Number(process.env.PORT ?? 3000),
    MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chatsc',
    API_PREFIX: process.env.API_PREFIX ?? 'api',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? 'replace-with-access-token-secret',
    ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 1800),
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? 'replace-with-refresh-token-secret',
    REFRESH_TOKEN_TTL_SECONDS: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 604800),
    REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
});
exports.backendEnv = backendEnv;
//# sourceMappingURL=env.config.js.map