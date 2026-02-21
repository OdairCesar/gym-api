import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Gymplan from '#models/gymplan.model'
import Gymsubscription from '#models/gymsubscription.model'
import Gym from '#models/gym.model'
import { PaymentFactory } from './factories/payment.factory.js'
import type { PaymentResult } from './interfaces/payment.js'
import logger from '@adonisjs/core/services/logger'
import { PLAN_SLUGS, SUBSCRIPTION_STATUS, PAYMENT_METHODS } from '#types/subscription.type'

@inject()
export default class PaymentService {
  /**
   * Cria ou atualiza uma assinatura de academia
   */
  async subscribe(
    gymId: number,
    planSlug: string,
    paymentMethod: string,
    paymentData: any = null
  ): Promise<Gymsubscription> {
    const plan = await Gymplan.findByOrFail('slug', planSlug)
    const gym = await Gym.findOrFail(gymId)

    // Plano free não precisa processar pagamento
    if (planSlug === PLAN_SLUGS.INITIAL || paymentMethod === PAYMENT_METHODS.FREE) {
      return await this.createSubscription(gym, plan, PAYMENT_METHODS.FREE, null)
    }

    // Validar método de pagamento
    this.validatePaymentMethod(paymentMethod)

    // Processar pagamento
    const paymentResult = await this.processPayment(plan, paymentMethod, paymentData)

    // Criar subscription paga
    return await this.createSubscription(gym, plan, paymentMethod, paymentResult)
  }

  /**
   * Cancela uma assinatura e move para plano inicial
   */
  async cancel(subscriptionId: number): Promise<void> {
    const subscription = await Gymsubscription.findOrFail(subscriptionId)
    const gym = await Gym.findOrFail(subscription.gymId)
    const initialPlan = await Gymplan.findByOrFail('slug', PLAN_SLUGS.INITIAL)

    // Usar transação para garantir atomicidade
    await db.transaction(async (trx) => {
      // Marcar subscription atual como cancelada
      subscription.useTransaction(trx)
      subscription.status = SUBSCRIPTION_STATUS.CANCELLED
      await subscription.save()

      // Criar nova subscription no plano inicial
      const newSubscription = await Gymsubscription.create(
        {
          gymId: gym.id,
          gymPlanId: initialPlan.id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          paymentMethod: PAYMENT_METHODS.FREE,
          currentPeriodStart: DateTime.now(),
          currentPeriodEnd: null,
        },
        { client: trx }
      )

      // Atualizar referência da academia
      gym.useTransaction(trx)
      gym.currentSubscriptionId = newSubscription.id
      await gym.save()
    })

    logger.info(`Subscription ${subscriptionId} cancelled, gym ${gym.id} moved to initial plan`)
  }

  /**
   * Troca de plano
   */
  async change(
    subscriptionId: number,
    newPlanSlug: string,
    paymentMethod: string,
    paymentData: any = null
  ): Promise<Gymsubscription> {
    const subscription = await Gymsubscription.findOrFail(subscriptionId)

    // Cancelar subscription atual
    subscription.status = SUBSCRIPTION_STATUS.CANCELLED
    await subscription.save()

    // Criar nova subscription
    return await this.subscribe(subscription.gymId, newPlanSlug, paymentMethod, paymentData)
  }

  /**
   * Retorna métodos de pagamento disponíveis
   */
  getSupportedPaymentMethods(): string[] {
    return PaymentFactory.getSupportedMethods()
  }

  /**
   * Retorna métodos de pagamento configurados
   */
  getConfiguredPaymentMethods(): string[] {
    return PaymentFactory.getConfiguredMethods()
  }

  /**
   * Valida se o método de pagamento é suportado e configurado
   */
  private validatePaymentMethod(paymentMethod: string): void {
    const supportedMethods = PaymentFactory.getSupportedMethods()
    if (!supportedMethods.includes(paymentMethod)) {
      throw new Error(`Payment method not supported: ${paymentMethod}`)
    }

    const strategy = PaymentFactory.create(paymentMethod)
    if (!strategy.isConfigured()) {
      throw new Error(`Payment provider ${paymentMethod} is not configured`)
    }
  }

  /**
   * Processa pagamento usando a estratégia apropriada
   */
  private async processPayment(
    plan: Gymplan,
    paymentMethod: string,
    paymentData: any
  ): Promise<PaymentResult> {
    const strategy = PaymentFactory.create(paymentMethod)

    // Validar dados de pagamento
    const isValid = await strategy.validatePaymentData(paymentData)
    if (!isValid) {
      throw new Error('Invalid payment data')
    }

    // Processar pagamento
    const result = await strategy.processPayment(plan.price, 'BRL', paymentData)

    if (!result.success) {
      logger.error('Payment processing failed', { error: result.errorMessage })
      throw new Error(result.errorMessage || 'Payment processing failed')
    }

    return result
  }

  /**
   * Cria uma nova subscription (free ou paga)
   */
  private async createSubscription(
    gym: Gym,
    plan: Gymplan,
    paymentMethod: string,
    paymentResult: PaymentResult | null
  ): Promise<Gymsubscription> {
    let subscription: Gymsubscription

    // Usar transação para garantir atomicidade
    await db.transaction(async (trx) => {
      // Cancelar subscription atual se existir
      if (gym.currentSubscriptionId) {
        const currentSubscription = await Gymsubscription.findOrFail(gym.currentSubscriptionId)
        currentSubscription.useTransaction(trx)
        currentSubscription.status = SUBSCRIPTION_STATUS.CANCELLED
        await currentSubscription.save()
      }

      // Determinar período de validade
      const isFree = paymentMethod === PAYMENT_METHODS.FREE
      const currentPeriodEnd = isFree ? null : DateTime.now().plus({ months: 1 })

      // Criar nova subscription
      subscription = await Gymsubscription.create(
        {
          gymId: gym.id,
          gymPlanId: plan.id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          paymentMethod: paymentMethod,
          paymentProvider: paymentResult?.provider || null,
          paymentProviderId: paymentResult?.transactionId || null,
          paymentMetadata: paymentResult?.metadata || null,
          currentPeriodStart: DateTime.now(),
          currentPeriodEnd: currentPeriodEnd,
        },
        { client: trx }
      )

      // Atualizar referência da academia
      gym.useTransaction(trx)
      gym.currentSubscriptionId = subscription.id
      await gym.save()
    })

    logger.info(
      `Subscription created for gym ${gym.id}, plan: ${plan.slug}, method: ${paymentMethod}`
    )

    return subscription!
  }
}
