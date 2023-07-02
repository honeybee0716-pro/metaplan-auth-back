import { FormattedUser } from '../../users/types/user.types'
import { ApiProperty } from '@nestjs/swagger'
import { UserApiModel } from '../../users/models/user.model'

export class SignInResponse {
  @ApiProperty({ type: UserApiModel })
  user: FormattedUser

  @ApiProperty()
  accessToken: string

  constructor(user: FormattedUser, accessToken: string) {
    this.user = user;
    this.accessToken = accessToken;
  }
}

export interface JWKSPayload {
  id: number
  name: string
  email: string
  roles: number[]
  exp: number
}
