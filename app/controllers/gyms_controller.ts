import Gym from '#models/gym'
import { createGymValidator, updateGymValidator } from '#validators/gym_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class GymsController {
  /**
   * List all gyms (users can only see their own gym)
   * GET /gyms
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing gyms: user ${currentUser.id}`)

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    let query = Gym.query()

    // All users can only see their own gym (multi-tenant)
    query = query.where('id', currentUser.gym_id)

    const gyms = await query.orderBy('name', 'asc').paginate(page, limit)

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
    if (!currentUser.is_super) {
      return response.forbidden({ message: 'Only super users can create gyms' })
    }

    const data = await request.validateUsing(createGymValidator)

    const gym = await Gym.create({
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      email: data.email,
      cnpj: data.cnpj,
      published: data.published ?? true,
    })

    logger.info(`Gym created successfully: ${gym.id} - ${gym.name}`)

    return response.created(gym)
  }

  /**
   * Show single gym
   * GET /gyms/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching gym details: gym ${params.id}, user ${currentUser.id}`)

    const gym = await Gym.findOrFail(params.id)

    // Users can only see their own gym (multi-tenant)
    if (gym.id !== currentUser.gym_id) {
      return response.forbidden({ message: 'You do not have permission to view this gym' })
    }

    return response.ok(gym)
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
    if (!currentUser.is_admin || gym.id !== currentUser.gym_id) {
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

    // Only admin can delete gym (in production, restrict to super admin)
    if (!currentUser.is_admin) {
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
    if (!currentUser.is_admin || gym.id !== currentUser.gym_id) {
      return response.forbidden({ message: 'Only the gym admin can view statistics' })
    }

    const stats = {
      gym: {
        id: gym.id,
        name: gym.name,
      },
      totalUsers: gym.users.length,
      totalClients: gym.users.filter((u) => !u.is_admin && !u.is_personal).length,
      totalPersonals: gym.users.filter((u) => u.is_personal).length,
      totalAdmins: gym.users.filter((u) => u.is_admin).length,
      totalDiets: gym.diets.length,
      totalTrainings: gym.trainings.length,
      totalProducts: gym.products.length,
    }

    return response.ok(stats)
  }
}
