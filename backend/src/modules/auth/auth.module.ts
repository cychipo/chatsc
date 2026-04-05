import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthProcessingService } from './auth-processing.service'
import { AuthService } from './auth.service'
import { AuthSerializer } from './auth.serializer'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { SessionAuthGuard } from './guards/session-auth.guard'
import { AccessTokenAuthGuard } from './guards/access-token-auth.guard'
import { AuthAttempt, AuthAttemptSchema } from './schemas/auth-attempt.schema'
import { RefreshSession, RefreshSessionSchema } from './schemas/refresh-session.schema'
import { User, UserSchema } from './schemas/user.schema'
import { GoogleStrategy } from './strategies/google.strategy'

@Module({
  imports: [
    PassportModule.register({ session: true }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthAttempt.name, schema: AuthAttemptSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthProcessingService, AuthSerializer, GoogleStrategy, GoogleAuthGuard, SessionAuthGuard, AccessTokenAuthGuard],
  exports: [AuthService, AuthProcessingService, AccessTokenAuthGuard],
})
export class AuthModule {}
