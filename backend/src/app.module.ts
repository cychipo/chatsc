import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { backendEnv } from './config/env.config'
import { createMongooseConfig } from './database/mongoose.config'
import { HealthModule } from './modules/health/health.module'
import { AuthModule } from './modules/auth/auth.module'
import { ChatModule } from './modules/chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [backendEnv],
    }),
    MongooseModule.forRootAsync({
      useFactory: createMongooseConfig,
    }),
    HealthModule,
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}
