import Gym from '#models/gym.model'
import Gymplan from '#models/gymplan.model'
import Gymsubscription from '#models/gymsubscription.model'
import { createGymValidator, updateGymValidator } from '#validators/gym.validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import { PLAN_SLUGS, SUBSCRIPTION_STATUS, PAYMENT_METHODS } from '#types/subscription.type'

export default class GymsController {
  /**
   * List all gyms
   * - Unauthenticated: returns all published gyms with limited fields
   * - Authenticated: returns the user's own gym with full data
   * GET /gyms
   */
  async index({ auth, request, response }: HttpContext) {
    const isAuthenticated = await auth.check()

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    if (isAuthenticated) {
      const currentUser = auth.getUserOrFail()
      logger.info(`Listing gyms: user ${currentUser.id}`)

      // Authenticated users can only see their own gym (multi-tenant)
      const gyms = await Gym.query()
        .where('id', currentUser.gym_id)
        .orderBy('name', 'asc')
        .paginate(page, limit)

      return response.ok(gyms)
    }

    // Unauthenticated: return all published gyms with limited public fields
    logger.info('Listing public gyms (unauthenticated)')

    const gyms = await Gym.query()
      .where('published', true)
      .select('id', 'name', 'description', 'address', 'phone', 'published')
      .orderBy('name', 'asc')
      .paginate(page, limit)

    return response.ok(gyms)
  }

  /**
   * Create gym (only super users can create gyms)
   * POST /gyms
   */
  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new gym: by user ${currentUser.id}`)

    // Only super users can create gyms
    if (currentUser.role !== 'super') {
      return response.forbidden({ message: 'Only super users can create gyms' })
    }

    const data = await request.validateUsing(createGymValidator)

    // 1. Criar a academia
    const gym = await Gym.create({
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      email: data.email,
      cnpj: data.cnpj,
      published: data.published ?? true,
    })

    // 2. Buscar o plano inicial (gratuito)
    const initialPlan = await Gymplan.findByOrFail('slug', PLAN_SLUGS.INITIAL)

    // 3. Criar a subscription inicial
    const subscription = await Gymsubscription.create({
      gymId: gym.id,
      gymPlanId: initialPlan.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      paymentMethod: PAYMENT_METHODS.FREE,
      currentPeriodStart: DateTime.now(),
      currentPeriodEnd: null, // Plano free não expira
    })

    // 4. Atualizar gym com a subscription
    gym.currentSubscriptionId = subscription.id
    await gym.save()

    logger.info(
      `Gym created successfully: ${gym.id} - ${gym.name} with initial plan subscription ${subscription.id}`
    )

    return response.created(gym)
  }

  /**
   * Show single gym
   * - Unauthenticated: returns limited fields if gym is published
   * - Authenticated: returns full data (own gym only)
   * GET /gyms/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const isAuthenticated = await auth.check()

    const gym = await Gym.findOrFail(params.id)

    if (isAuthenticated) {
      const currentUser = auth.getUserOrFail()
      logger.info(`Fetching gym details: gym ${params.id}, user ${currentUser.id}`)

      // Users can only see their own gym (multi-tenant)
      if (gym.id !== currentUser.gym_id) {
        return response.forbidden({ message: 'You do not have permission to view this gym' })
      }

      return response.ok(gym)
    }

    // Unauthenticated: only allow access to published gyms with limited fields
    logger.info(`Fetching public gym details: gym ${params.id}`)

    if (!gym.published) {
      return response.notFound({ message: 'Gym not found' })
    }

    const publicData = {
      id: gym.id,
      name: gym.name,
      description: gym.description,
      address: gym.address,
      phone: gym.phone,
      published: gym.published,
    }

    return response.ok(publicData)
  }

  /**
   * Update gym (admin of the gym only)
   * PUT/PATCH /gyms/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const gym = await Gym.findOrFail(params.id)
    logger.info(`Updating gym: ${gym.id} by user ${currentUser.id}`)

    // Only admin of this specific gym can update
    if (
      (currentUser.role !== 'admin' && currentUser.role !== 'super') ||
      gym.id !== currentUser.gym_id
    ) {
      return response.forbidden({ message: 'Only the gym admin can update gym details' })
    }

    const data = await request.validateUsing(updateGymValidator)

    // Check email uniqueness if being changed
    if (data.email && data.email !== gym.email) {
      const existingGym = await Gym.query().where('email', data.email).first()
      if (existingGym) {
        return response.conflict({ message: 'Email already in use by another gym' })
      }
    }

    // Check CNPJ uniqueness if being changed
    if (data.cnpj && data.cnpj !== gym.cnpj) {
      const existingGym = await Gym.query().where('cnpj', data.cnpj).first()
      if (existingGym) {
        return response.conflict({ message: 'CNPJ already in use by another gym' })
      }
    }

    gym.merge({
      name: data.name ?? gym.name,
      description: data.description ?? gym.description,
      address: data.address ?? gym.address,
      phone: data.phone ?? gym.phone,
      email: data.email ?? gym.email,
      cnpj: data.cnpj ?? gym.cnpj,
      published: data.published ?? gym.published,
    })

    await gym.save()

    logger.info(`Gym updated successfully: ${gym.id}`)

    return response.ok(gym)
  }

  /**
   * Delete gym (super admin only - dangerous operation)
   * DELETE /gyms/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Deleting gym: ${params.id} by user ${currentUser.id}`)

    // Only admin can delete gym
    if (currentUser.role !== 'admin' && currentUser.role !== 'super') {
      return response.forbidden({ message: 'Only admins can delete gyms' })
    }

    const gym = await Gym.findOrFail(params.id)

    // Admin can only delete their own gym
    if (gym.id !== currentUser.gym_id) {
      return response.forbidden({ message: 'You can only delete your own gym' })
    }

    // Note: This will cascade delete all related data (users, diets, trainings, products)
    // In production, consider soft delete or additional safeguards
    await gym.delete()

    logger.info(`Gym deleted successfully: ${gym.id}`)

    return response.noContent()
  }

  /**
   * Get gym statistics (admin only)
   * GET /gyms/:id/stats
   */
  async stats({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching gym statistics: gym ${params.id}, user ${currentUser.id}`)

    const gym = await Gym.query()
      .where('id', params.id)
      .preload('users')
      .preload('diets')
      .preload('trainings')
      .preload('products')
      .firstOrFail()

    // Only admin of this gym can see stats
    if (currentUser.role !== 'admin' || gym.id !== currentUser.gym_id) {
      return response.forbidden({ message: 'Only the gym admin can view statistics' })
    }

    const stats = {
      gym: {
        id: gym.id,
        name: gym.name,
      },
      totalUsers: gym.users.length,
      totalClients: gym.users.filter((u) => u.role === 'user').length,
      totalPersonals: gym.users.filter((u) => u.role === 'personal').length,
      totalAdmins: gym.users.filter((u) => u.role === 'admin').length,
      totalDiets: gym.diets.length,
      totalTrainings: gym.trainings.length,
      totalProducts: gym.products.length,
    }

    return response.ok(stats)
  }
}
