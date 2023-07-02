import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { JWKSClient } from '../jwks/jwks.client'
import { UsersService } from '../../users/users.service'
import { IS_PUBLIC_KEY } from '../../common/decorators/public-route.decorator'
import { JWKSPayload } from '../types/auth.types'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
    private jwksClient: JWKSClient,
    private userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }
    try {
      const userData = (await this.jwksClient.validateOauthJWKS(
        token,
      )) as unknown as JWKSPayload

      if (userData) {
        const user = await this.userService.getExistOrCreateNewUser(userData)

        request.user = {
          ...userData,
          planId: user.planId,
          isBillingConnected: user.isBillingConnected,
          stripeId: user?.stripeId,
        }

        // fixme spaceId
        request.spaceId = await this.userService.getUserSpaceId(request.user.id)
      }
    } catch {
      try {
        const userData = await this.jwksClient.validateLocalJWT(token)
        if (userData) {
          request.user = userData
        }
      } catch {
        throw new UnauthorizedException()
      }
    }
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
