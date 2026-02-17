import Diet from '#models/diet'
import { createDietValidator, updateDietValidator } from '#validators/diet_validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission_service'
import logger from '@adonisjs/core/services/logger'

export default class DietsController {
  /**
   * List all diets (filtered by gym and permissions)
   * GET /diets
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing diets: user ${currentUser.id}`)

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    // Query
    let query = Diet.query().preload('gym').preload('criador')

    // Admins see all diets from their gym
    // Personals see diets they created + diets from gyms they have permission
    // Clients see only their assigned diet
    if (currentUser.is_admin) {
      query = query.where('gym_id', currentUser.gym_id)
    } else if (currentUser.is_personal) {
      // Get gyms where personal has permission
      const permittedGymIds = await PermissionService.getGymsWithPermissionForPersonal(
        currentUser.id,
        'diets'
      )

      query = query.where((subQuery) => {
        subQuery
          .where('creator_id', currentUser.id)
          .orWhereIn('gym_id', [currentUser.gym_id, ...permittedGymIds])
      })
    } else {
      // Client sees only their diet
      if (currentUser.diet_id) {
        query = query.where('id', currentUser.diet_id)
      } else {
        // No diet assigned
        return response.ok({ data: { data: [], meta: { total: 0 } } })
      }
    }

    const diets = await query.paginate(page, limit)

    return response.ok({
      data: diets.serialize(),
    })
  }

  /**
   * Get single diet by ID
   * GET /diets/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching diet details: diet ${params.id}, user ${currentUser.id}`)

    const diet = await Diet.query()
      .where('id', params.id)
      .preload('gym')
      .preload('criador')
      .preload('meals', (mealsQuery) => {
        mealsQuery.preload('foods')
      })
      .firstOrFail()

    // Check if user can view this diet
    const canView =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id)))) ||
      currentUser.diet_id === diet.id

    if (!canView) {
      return response.forbidden({ message: 'You do not have permission to view this diet' })
    }

    return response.ok({
      data: diet.serialize(),
    })
  }

  /**
   * Create new diet
   * POST /diets
   */
  async create({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new diet: user ${currentUser.id}`)

    // Only admin and personal can create diets
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can create diets' })
    }

    // Validate request data
    const data = await request.validateUsing(createDietValidator)

    // Create diet
    const diet = await Diet.create({
      name: data.name,
      description: data.description,
      calories: data.calories,
      proteins: data.proteins,
      carbohydrates: data.carbohydrates,
      fats: data.fats,
      gym_id: currentUser.gym_id,
      creator_id: currentUser.id,
    })

    await diet.load('gym')
    await diet.load('criador')

    logger.info(`Diet created successfully: ${diet.id}`)

    return response.created({
      message: 'Diet created successfully',
      data: diet.serialize(),
    })
  }

  /**
   * Update diet
   * PUT/PATCH /diets/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.id)
    logger.info(`Updating diet: ${diet.id} by user ${currentUser.id}`)

    // Check permission
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this diet' })
    }

    // Validate request data
    const data = await request.validateUsing(updateDietValidator)

    // Update diet
    diet.merge({
      name: data.name,
      description: data.description,
      calories: data.calories,
      proteins: data.proteins,
      carbohydrates: data.carbohydrates,
      fats: data.fats,
    })

    await diet.save()
    await diet.load('gym')
    await diet.load('criador')

    return response.ok({
      message: 'Diet updated successfully',
      data: diet.serialize(),
    })
  }

  /**
   * Delete diet
   * DELETE /diets/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.id)

    // Check permission
    const canDelete =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal && diet.creator_id === currentUser.id)

    if (!canDelete) {
      return response.forbidden({ message: 'You do not have permission to delete this diet' })
    }

    await diet.delete()

    return response.ok({
      message: 'Diet deleted successfully',
    })
  }
}
