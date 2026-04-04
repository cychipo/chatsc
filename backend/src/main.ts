import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { backendEnv } from './config/env.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = backendEnv()

  app.setGlobalPrefix(env.API_PREFIX)
  app.enableCors()

  await app.listen(env.PORT)
}

void bootstrap()
