import session from 'express-session'
import passport from 'passport'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { backendEnv } from './config/env.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = backendEnv()

  app.setGlobalPrefix(env.API_PREFIX)
  app.enableCors({
    origin: process.env.FRONTEND_APP_URL ?? 'http://localhost:5173',
    credentials: true,
  })
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'replace-with-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
      },
    }),
  )
  app.use(passport.initialize())
  app.use(passport.session())

  await app.listen(env.PORT)
}

void bootstrap()
