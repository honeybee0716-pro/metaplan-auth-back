import { User } from '@prisma/client'
import { UserDataApiModel } from '../models/user-data.model'

export type FormattedUser = Omit<
  User,
  | 'password'
  | 'stripeId'
  | 'createdAt'
  | 'updatedAt'
  | 'username'
  | 'id'
  | 'email'
> & { isStripeConfigured: boolean; data: UserDataApiModel }
