import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class SignInDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly password: string

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
