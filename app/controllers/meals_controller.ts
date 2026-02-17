import Meal from '#models/meal'
import Diet from '#models/diet'
import { createMealValidator, updateMealValidator } from '#validators/meal_validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission_service'
import logger from '@adonisjs/core/services/logger'

export default class MealsController {
  /**
   * List all meals from a diet
   * GET /diets/:dietId/meals
   */
  async index({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.dietId)
    logger.info(`Listing meals from diet: diet ${diet.id}, user ${currentUser.id}`)

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

    const meals = await Meal.query().where('diet_id', diet.id).preload('foods').orderBy('id', 'asc')

    return response.ok({
      data: meals.map((meal) => meal.serialize()),
    })
  }

  /**
   * Get single meal by ID
   * GET /diets/:dietId/meals/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.dietId)
    logger.info(`Fetching meal details: meal ${params.id}, diet ${diet.id}, user ${currentUser.id}`)

    const meal = await Meal.query()
      .where('id', params.id)
      .where('diet_id', diet.id)
      .preload('foods')
      .firstOrFail()

    // Check if user can view this diet
    const canView =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id)))) ||
      currentUser.diet_id === diet.id

    if (!canView) {
      return response.forbidden({ message: 'You do not have permission to view this meal' })
    }

    return response.ok({
      data: meal.serialize(),
    })
  }

  /**
   * Create new meal in a diet
   * POST /diets/:dietId/meals
   */
  async create({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.dietId)
    logger.info(`Creating new meal: diet ${diet.id}, user ${currentUser.id}`)

    // Check permission to edit diet
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this diet' })
    }

    // Validate request data
    const data = await request.validateUsing(createMealValidator)

    // Create meal
    const meal = await Meal.create({
      name: data.name,
      description: data.description,
      hourly: data.hourly,
      diet_id: diet.id,
    })

    await meal.load('foods')

    logger.info(`Meal created successfully: meal ${meal.id}, diet ${diet.id}`)

    return response.created({
      message: 'Meal created successfully',
      data: meal.serialize(),
    })
  }

  /**
   * Update meal
   * PUT/PATCH /diets/:dietId/meals/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.dietId)
    const meal = await Meal.query().where('id', params.id).where('diet_id', diet.id).firstOrFail()

    // Check permission to edit diet
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this meal' })
    }

    // Validate request data
    const data = await request.validateUsing(updateMealValidator)

    // Update meal
    meal.merge({
      name: data.name,
      description: data.description,
      hourly: data.hourly,
    })

    await meal.save()
    await meal.load('foods')

    return response.ok({
      message: 'Meal updated successfully',
      data: meal.serialize(),
    })
  }

  /**
   * Delete meal
   * DELETE /diets/:dietId/meals/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.dietId)
    const meal = await Meal.query().where('id', params.id).where('diet_id', diet.id).firstOrFail()

    // Check permission to edit diet
    const canDelete =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal && diet.creator_id === currentUser.id)

    if (!canDelete) {
      return response.forbidden({ message: 'You do not have permission to delete this meal' })
    }

    await meal.delete()

    return response.ok({
      message: 'Meal deleted successfully',
    })
  }
}
