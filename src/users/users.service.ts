import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { PlanName, Prisma, User } from '@prisma/client'
import { Stripe } from 'stripe'
import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { UserApiModel } from './models/user.model'
import {
  UserDataApiModel,
  UserPaymentAddress,
} from './models/user-data.model'
import { JWKSPayload } from '../auth/types/auth.types'

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @InjectStripeClient() private stripe: Stripe,
  ) {}

  findOne(params: Prisma.UserFindUniqueArgs): Promise<User> {
    return this.prisma.user.findUnique({
      ...params,
      include: {
        plan: {
          select: { planName: true, pricePerMonth: true, pricePerYear: true },
        },
      },
    })
  }

  async getExistOrCreateNewUser(userData: JWKSPayload): Promise<User> {
    const { email, name } = userData
    const existedUser = await this.findOne({ where: { email } })
    if (!existedUser) {
      return this.prisma.user.create({
        data: {
          email,
          username: name,
          password: '',
          plan: { connect: { planName: PlanName.BASE } },
        },
      })
    }
    return existedUser
  }

  async getUserData(user: User): Promise<UserApiModel> {
    let isBillingConnected = user.isBillingConnected

    //   fixme remove if block when stripe webhook configured
    const initialAddress: UserPaymentAddress = {
      country: '',
      state: '',
      postal_code: '',
      city: '',
      line1: '',
      line2: '',
    }
    if (user.stripeId) {
      const { email, stripeId } = user

      if (isBillingConnected !== (await this.checkUserBilling(stripeId))) {
        isBillingConnected = !isBillingConnected
        await this.updateUserIsBillingConnected(email, isBillingConnected)
      }

      const stripeCustomerData = await this.stripe.customers.retrieve(
        user.stripeId,
      )

      if (stripeCustomerData.deleted !== true) {
        const address =
          (stripeCustomerData.address as UserPaymentAddress) || initialAddress
        const taxIds = (
          await this.stripe.customers.listTaxIds(user.stripeId)
        ).data.map(({ type, value }) => ({ type, value }))

        return {
          id: user.id,
          isStripeConfigured: true,
          isBillingConnected,
          planId: user.planId,
          data: {
            name: stripeCustomerData.name ?? '',
            email: stripeCustomerData.email,
            address,
            taxIds,
          },
        }
      }
    }

    return {
      id: user.id,
      isStripeConfigured: false,
      isBillingConnected,
      planId: user.planId,
      data: {
        name: user.username,
        email: user.email,
        address: initialAddress,
        taxIds: [],
      },
    }
  }

  async registerStripeCustomer(email: string): Promise<Stripe.Customer> {
    const stripeCustomer = await this.stripe.customers.create({
      email,
    })

    await this.prisma.user.update({
      where: { email },
      data: { stripeId: stripeCustomer.id },
    })

    return stripeCustomer
  }

  async updateUserData(
    authUser: User,
    userData: UserDataApiModel,
  ): Promise<Stripe.Customer> {
    const stripeId =
      authUser.stripeId ||
      (await this.registerStripeCustomer(userData.email)).id

    const { taxIds: updateTaxIds, ...restUserData } = userData

    // crutch on customer's request (if no needed longer move it to --> RIGHT WAY)
    if (
      authUser.email !== userData.email ||
      authUser.username !== userData.name
    ) {
      await this.prisma.user.update({
        where: { email: authUser.email },
        data: { email: userData.email, username: userData.name },
      })
    }

    await this.stripe.customers.update(stripeId, restUserData)
    // -----

    const taxIds = (await this.stripe.customers.listTaxIds(stripeId)).data

    const taxIdsForUpdate = updateTaxIds.filter(
      ({ type, value }) =>
        !taxIds.find(
          ({ type: existingType, value: existingValue }) =>
            type === existingType && value === existingValue,
        ),
    )

    const createdTaxIds:any[] = []
    let isConflictException = false

    await Promise.all(
      taxIdsForUpdate.map(async ({ type, value }) => {
        const { id } = await this.stripe.customers.createTaxId(stripeId, {
          type: type as Stripe.TaxIdCreateParams.Type,
          value,
        })

        createdTaxIds.push(id)
      }),
    )
      .catch(async (error) => {
        await Promise.all(
          createdTaxIds.map(
            async ({ id }) =>
              await this.stripe.customers.deleteTaxId(stripeId, id),
          ),
        )

        isConflictException = true

        throw new ConflictException(error.raw.message)
      })
      .finally(async () => {
        if (!isConflictException) {
          const taxIdsForDeleteAfterUpdate = taxIds.filter(
            ({ type: existingType, value: existingValue }) =>
              !updateTaxIds.find(
                ({ type, value }) =>
                  existingType === type && existingValue === value,
              ),
          )

          await Promise.all(
            taxIdsForDeleteAfterUpdate.map(
              async ({ id }) =>
                await this.stripe.customers.deleteTaxId(stripeId, id),
            ),
          )
        }
      })

    // --> RIGHT WAY

    return (await this.stripe.customers.retrieve(stripeId)) as Stripe.Customer
  }

  async updateUserIsBillingConnected(
    email: string,
    isBillingConnected: boolean,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { email },
      data: { isBillingConnected },
    })
  }

  async checkUserBilling(stripeId: string): Promise<boolean> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: stripeId,
    })
    return !!paymentMethods.data?.length
  }

  // fixme temporary crutch to get spaceId -> probably update user model
  async getUserSpaceId(userId: number): Promise<number> {
    const { id: spaceId } = await this.prisma.space.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    })

    return spaceId
  }
}
