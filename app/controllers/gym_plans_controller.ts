import GymPlan from '#models/gym_plan'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class GymPlansController {
  /**
   * Listar todos os planos ativos
   * GET /gym-plans
   */
  async index({ response }: HttpContext) {
    logger.info('Listing active gym plans')

    const plans = await GymPlan.query().where('is_active', true).orderBy('price', 'asc')

    return response.ok({
      data: plans,
    })
  }

  /**
   * Detalhes de um plano específico
   * GET /gym-plans/:id
   */
  async show({ params, response }: HttpContext) {
    logger.info(`Fetching gym plan details: ${params.id}`)

    const plan = await GymPlan.findOrFail(params.id)

    return response.ok({
      data: plan,
    })
  }
}
