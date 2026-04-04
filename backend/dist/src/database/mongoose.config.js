"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMongooseConfig = void 0;
const env_config_1 = require("../config/env.config");
const createMongooseConfig = () => {
    const env = (0, env_config_1.backendEnv)();
    return {
        uri: env.MONGODB_URI,
    };
};
exports.createMongooseConfig = createMongooseConfig;
//# sourceMappingURL=mongoose.config.js.map