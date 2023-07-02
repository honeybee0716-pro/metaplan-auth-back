import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { JWKSClient } from './jwks/jwks.client'

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JWKSClient],
  exports: [AuthService, JWKSClient],
})
export class AuthModule {}
