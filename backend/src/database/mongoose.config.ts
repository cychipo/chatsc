import { MongooseModuleOptions } from '@nestjs/mongoose'
import { backendEnv } from '../config/env.config'

export const createMongooseConfig = (): MongooseModuleOptions => {
  const env = backendEnv()

  return {
    uri: env.MONGODB_URI,
  }
}
