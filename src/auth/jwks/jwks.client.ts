import { ConfigService } from '@nestjs/config'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as jose from 'jose'
import { UsersService } from '../../users/users.service'
import { User } from '@prisma/client'

@Injectable()
export class JWKSClient {
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async validateOauthJWKS(token: string): Promise<jose.JWTPayload> {
    const JWKS = await jose.importJWK(
      JSON.parse(this.configService.get('AUTH_PUBLIC_KEY')),
    )
    const { payload } = await jose.jwtVerify(token, JWKS)
    return payload
  }

  async validateLocalJWT(token: string): Promise<User> {
    const verified = await jose.jwtVerify(
      token,
      new TextEncoder().encode(this.configService.get('JWT_SECRET')),
    )

    if (verified) {
      const { sub } = jose.decodeJwt(token)
      const user = await this.userService.findOne({
        where: { id: +sub },
      })
      if (!user) {
        throw new UnauthorizedException()
      }
      return user
    }
  }

  async signLocalJwt(payload: jose.JWTPayload): Promise<string> {
    const secret = new TextEncoder().encode(
      this.configService.get('JWT_SECRET'),
    )
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret)
  }
}
