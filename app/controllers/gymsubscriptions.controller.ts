import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import Gym from '#models/gym.model'
import PaymentService from '#services/payment.service'
import { createSubscriptionValidator } from '#validators/gymsubscription.validator'
import { PLAN_SLUGS, PAYMENT_METHODS } from '#types/subscription.type'

@inject()
export default class UserpermissionsControllers {
  constructor(protected paymentService: PaymentService) {}

  /**
   * Ver assinatura atual da academia
   * GET /gyms/:gymId/subscription
   */
  async show({ auth, bouncer, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const gymId = Number(params.gymId)

    logger.info(`Fetching subscription for gym ${gymId}, user ${currentUser.id}`)

    // Verificar autorização
    await bouncer.with('SubscriptionPolicy').authorize('view', gymId)

    // Buscar academia com subscription e plano
    const gym = await Gym.query()
      .where('id', gymId)
      .preload('currentSubscription', (query) => {
        query.preload('gymPlan')
      })
      .firstOrFail()

    // Buscar métodos de pagamento configurados
    const configuredMethods = this.paymentService.getConfiguredPaymentMethods()

    return response.ok({
      data: {
        subscription: gym.currentSubscription,
        available_payment_methods: configuredMethods,
      },
    })
  }

  /**
   * Assinar ou trocar de plano
   * POST /gyms/:gymId/subscription
   */
  async store({ auth, bouncer, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const gymId = Number(params.gymId)

    logger.info(`Creating/updating subscription for gym ${gymId}, user ${currentUser.id}`)

    // Verificar autorização
    await bouncer.with('SubscriptionPolicy').authorize('manage', gymId)

    // Validar dados
    const data = await request.validateUsing(createSubscriptionValidator)

    // Verificar se o método de pagamento é suportado
    const supportedMethods = this.paymentService.getSupportedPaymentMethods()
    if (!supportedMethods.includes(data.payment_method)) {
      return response.badRequest({
        message: `Payment method not supported: ${data.payment_method}`,
        supported_methods: supportedMethods,
      })
    }

    // Validar combinação de plano e método de pagamento
    const validationError = this.validatePlanPaymentCombination(data.plan_slug, data.payment_method)
    if (validationError) {
      return response.badRequest({ message: validationError })
    }

    try {
      // Criar/atualizar subscription via PaymentService
      const subscription = await this.paymentService.subscribe(
        gymId,
        data.plan_slug,
        data.payment_method,
        data.payment_data
      )

      await subscription.load('gymPlan')

      logger.info(`Subscription created/updated successfully for gym ${gymId}`)

      return response.ok({
        message: 'Subscription updated successfully',
        data: subscription,
      })
    } catch (error) {
      const err = error as Error
      logger.error(`Subscription failed for gym ${gymId}`, { error: err.message })

      return response.badRequest({
        message: err.message || 'Failed to process subscription',
      })
    }
  }

  /**
   * Cancelar assinatura
   * DELETE /gyms/:gymId/subscription
   */
  async destroy({ auth, bouncer, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const gymId = Number(params.gymId)

    logger.info(`Cancelling subscription for gym ${gymId}, user ${currentUser.id}`)

    // Verificar autorização
    await bouncer.with('SubscriptionPolicy').authorize('manage', gymId)

    // Buscar academia com subscription
    const gym = await Gym.query().where('id', gymId).preload('currentSubscription').firstOrFail()

    if (!gym.currentSubscription) {
      return response.badRequest({
        message: 'No active subscription found',
      })
    }

    // Não permitir cancelar plano inicial (free)
    if (gym.currentSubscription.isFree()) {
      return response.badRequest({
        message: 'Cannot cancel free plan subscription',
      })
    }

    try {
      // Cancelar via PaymentService (automaticamente move para plano initial)
      await this.paymentService.cancel(gym.currentSubscription.id)

      logger.info(`Subscription cancelled for gym ${gymId}`)

      return response.ok({
        message: 'Subscription cancelled successfully. Gym moved to initial plan.',
      })
    } catch (error) {
      const err = error as Error
      logger.error(`Failed to cancel subscription for gym ${gymId}`, { error: err.message })

      return response.badRequest({
        message: err.message || 'Failed to cancel subscription',
      })
    }
  }

  /**
   * Valida a combinação de plano e método de pagamento
   */
  private validatePlanPaymentCombination(planSlug: string, paymentMethod: string): string | null {
    // Não permitir plano pago com payment_method 'free'
    if (planSlug !== PLAN_SLUGS.INITIAL && paymentMethod === PAYMENT_METHODS.FREE) {
      return 'Cannot subscribe to paid plan with payment method "free"'
    }

    // Validar que plano free use payment_method 'free'
    if (planSlug === PLAN_SLUGS.INITIAL && paymentMethod !== PAYMENT_METHODS.FREE) {
      return 'Initial plan must use payment method "free"'
    }

    return null
  }
}
