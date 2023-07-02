import { Request } from 'express'
import { User } from '@prisma/client'

export interface ExtendedRequest extends Request {
  user: User
  spaceId: number
}
