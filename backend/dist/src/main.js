"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_config_1 = require("./config/env.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const env = (0, env_config_1.backendEnv)();
    app.setGlobalPrefix(env.API_PREFIX);
    app.enableCors();
    await app.listen(env.PORT);
}
void bootstrap();
//# sourceMappingURL=main.js.map