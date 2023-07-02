import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { SignInDto } from '../auth/dto/signin.dto'
import { PublicRoute } from '../common/decorators/public-route.decorator'
import { SignInResponse } from '../auth/types/auth.types'
import { ExtendedRequest } from '../common/types/common.types'
import { ApiBearerAuth, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger'
import { UsersService } from '../users/users.service'
import { UserApiModel } from '../users/models/user.model'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UsersService,
  ) {}

  @Get()
  @ApiBearerAuth('jwt')
  @ApiResponse({
    status: 200,
    type: OmitType(SignInResponse, ['accessToken']),
    description: 'Get authorized user data',
  })
  @ApiResponse({ status: 401, description: 'Not authorized' })
  async getUserData(
    @Req() req: ExtendedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserApiModel> {
    try {
      const user = this.authService.formatUserData(req.user)
      res.status(HttpStatus.OK)
      return user
    } catch (e) {
      throw new BadRequestException(e)
    }
  }

  @PublicRoute()
  @Post()
  @ApiResponse({ status: 200, type: SignInResponse, description: 'Login user' })
  @ApiResponse({ status: 401, description: 'Not authorized' })
  async signIn(
    @Req() req: Request,
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignInResponse> {
    try {
      const authData = await this.authService.signIn(signInDto)
      res.status(HttpStatus.OK)
      return authData
    } catch (e) {
      throw e
    }
  }
}
