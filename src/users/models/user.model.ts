import { ApiProperty } from '@nestjs/swagger'
import { UserDataApiModel } from '../models/user-data.model'

export class UserApiModel {
  @ApiProperty({ description: 'User id in database' })
  readonly id: number

  @ApiProperty({ description: 'User plan id' })
  readonly planId: number

  @ApiProperty({ description: 'User billing connected state' })
  readonly isBillingConnected: boolean

  @ApiProperty({ description: 'User stripe configured status' })
  readonly isStripeConfigured: boolean

  @ApiProperty({ description: 'User customer data' })
  readonly data: UserDataApiModel

  constructor() {
    this.id = 0;
    this.planId = 0;
    this.isBillingConnected = false;
    this.isStripeConfigured = false;
    this.data = new UserDataApiModel('','');
  }
}
