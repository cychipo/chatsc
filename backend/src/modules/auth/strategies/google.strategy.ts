import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20'
import { AuthService } from '../auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile'],
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
    try {
      const primaryEmail = profile.emails?.[0]?.value ?? ''
      const picture = profile.photos?.[0]?.value
      const user = await this.authService.upsertGoogleUser({
        googleId: profile.id,
        email: primaryEmail,
        displayName: profile.displayName || primaryEmail,
        avatarUrl: picture,
      })

      done(null, user)
    } catch (error) {
      done(error as Error)
    }
  }
}
