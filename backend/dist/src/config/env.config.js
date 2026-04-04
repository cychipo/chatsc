"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendEnv = void 0;
const backendEnv = () => ({
    PORT: Number(process.env.PORT ?? 3000),
    MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chatsc',
    API_PREFIX: process.env.API_PREFIX ?? 'api',
});
exports.backendEnv = backendEnv;
//# sourceMappingURL=env.config.js.map