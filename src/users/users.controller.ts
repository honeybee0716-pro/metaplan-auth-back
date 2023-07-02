import { Controller, Req, Res, Body, Patch, HttpStatus } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { UserDataApiModel } from './models/user-data.model'
import { UsersService } from './users.service'
import { ExtendedRequest } from '../common/types/common.types'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch()
  @ApiResponse({
    status: 422,
    description: 'TaxId invalid value',
  })
  async updateUserData(
    @Req() req: ExtendedRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() updateUserDataDto: UserDataApiModel,
  ) {
    try {
      await this.usersService.updateUserData(req.user, updateUserDataDto)
      res.status(HttpStatus.OK)
      return
    } catch (e) {
      throw e
    }
  }
}
