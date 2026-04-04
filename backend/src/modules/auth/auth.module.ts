import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthSerializer } from './auth.serializer'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { SessionAuthGuard } from './guards/session-auth.guard'
import { AuthAttempt, AuthAttemptSchema } from './schemas/auth-attempt.schema'
import { User, UserSchema } from './schemas/user.schema'
import { GoogleStrategy } from './strategies/google.strategy'

@Module({
  imports: [
    PassportModule.register({ session: true }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthAttempt.name, schema: AuthAttemptSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSerializer, GoogleStrategy, GoogleAuthGuard, SessionAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
