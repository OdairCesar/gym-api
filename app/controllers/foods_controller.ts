import Food from '#models/food'
import Meal from '#models/meal'
import { createFoodValidator, updateFoodValidator } from '#validators/food_validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission_service'
import logger from '@adonisjs/core/services/logger'

export default class FoodsController {
  /**
   * List all foods from a meal
   * GET /meals/:mealId/foods
   */
  async index({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    logger.info(`Listing foods from meal: meal ${meal.id}, user ${currentUser.id}`)

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

    const foods = await Food.query().where('meal_id', meal.id).orderBy('id', 'asc')

    return response.ok({
      data: foods.map((food) => food.serialize()),
    })
  }

  /**
   * Get single food by ID
   * GET /meals/:mealId/foods/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    logger.info(`Fetching food details: food ${params.id}, meal ${meal.id}, user ${currentUser.id}`)

    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    // Check if user can view this diet
    const canView =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id)))) ||
      currentUser.diet_id === diet.id

    if (!canView) {
      return response.forbidden({ message: 'You do not have permission to view this food' })
    }

    return response.ok({
      data: food.serialize(),
    })
  }

  /**
   * Create new food in a meal
   * POST /meals/:mealId/foods
   */
  async create({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    logger.info(`Creating new food: meal ${meal.id}, user ${currentUser.id}`)

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
    const data = await request.validateUsing(createFoodValidator)

    // Create food
    const food = await Food.create({
      name: data.name,
      meal_id: meal.id,
    })

    logger.info(`Food created successfully: food ${food.id}, meal ${meal.id}`)

    return response.created({
      message: 'Food created successfully',
      data: food.serialize(),
    })
  }

  /**
   * Update food
   * PUT/PATCH /meals/:mealId/foods/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    // Check permission to edit diet
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal &&
        (diet.creator_id === currentUser.id ||
          (await PermissionService.canEditDietById(currentUser.id, diet.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this food' })
    }

    // Validate request data
    const data = await request.validateUsing(updateFoodValidator)

    // Update food
    food.merge({
      name: data.name,
    })

    await food.save()

    return response.ok({
      message: 'Food updated successfully',
      data: food.serialize(),
    })
  }

  /**
   * Delete food
   * DELETE /meals/:mealId/foods/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    // Check permission to edit diet
    const canDelete =
      (currentUser.is_admin && currentUser.gym_id === diet.gym_id) ||
      (currentUser.is_personal && diet.creator_id === currentUser.id)

    if (!canDelete) {
      return response.forbidden({ message: 'You do not have permission to delete this food' })
    }

    await food.delete()

    return response.ok({
      message: 'Food deleted successfully',
    })
  }
}
