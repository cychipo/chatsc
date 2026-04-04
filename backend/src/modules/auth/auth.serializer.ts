import { Injectable } from '@nestjs/common'
import passport from 'passport'
import { AuthService } from './auth.service'
import { SessionUser } from './types/auth-session'

@Injectable()
export class AuthSerializer {
  constructor(private readonly authService: AuthService) {
    passport.serializeUser((user: Express.User, done) => {
      done(null, (user as SessionUser).id)
    })

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.authService.findById(id)
        done(null, user ?? null)
      } catch (error) {
        done(error as Error)
      }
    })
  }
}
