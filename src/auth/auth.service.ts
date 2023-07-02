import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SignInDto } from './dto/signin.dto'
import { UsersService } from '../users/users.service'
import { compare } from 'bcrypt'
import { SignInResponse } from './types/auth.types'
import { User } from '@prisma/client'
import { JWKSClient } from './jwks/jwks.client'
import { UserApiModel } from '../users/models/user.model'

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwksClient: JWKSClient,
  ) {}

  async signIn(signInDto: SignInDto): Promise<SignInResponse> {
    const { email, password } = signInDto
    const existedUser = await this.userService.findOne({ where: { email } })

    if (!existedUser) {
      throw new ForbiddenException('User no longer exist')
    }

    const isPasswordsEqual = await compare(password, existedUser.password)

    if (!isPasswordsEqual) {
      throw new UnauthorizedException('Incorrect email or password')
    }
    const accessToken = await this.createAuthToken(existedUser.id)
    const userData = await this.formatUserData(existedUser)

    delete existedUser.password
    delete existedUser.stripeId
    return {
      accessToken,
      user: userData,
    }
  }

  async formatUserData(user: User): Promise<UserApiModel> {
    return this.userService.getUserData(user)
  }

  createAuthToken(userId: number): Promise<string> {
    return this.jwksClient.signLocalJwt({ sub: String(userId) })
  }
}
