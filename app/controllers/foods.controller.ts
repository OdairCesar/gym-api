import Food from '#models/food.model'
import Meal from '#models/meal.model'
import { createFoodValidator, updateFoodValidator } from '#validators/food.validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission.service'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'

@inject()
export default class FoodsController {
  constructor(protected permissionService: PermissionService) {}

  /**
   * List all foods from a meal
   * GET /meals/:mealId/foods
   */
  async index({ bouncer, params, response }: HttpContext) {
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet

    await bouncer.with('DietPolicy').authorize('update', diet)

    const foods = await Food.query().where('meal_id', meal.id).orderBy('id', 'asc')

    return response.ok({
      data: foods.map((food) => food.serialize()),
    })
  }

  /**
   * Get single food by ID
   * GET /meals/:mealId/foods/:id
   */
  async show({ bouncer, params, response }: HttpContext) {
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet

    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    await bouncer.with('DietPolicy').authorize('update', diet)

    return response.ok({
      data: food.serialize(),
    })
  }

  /**
   * Create new food in a meal
   * POST /meals/:mealId/foods
   */
  async create({ bouncer, params, request, response }: HttpContext) {
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    logger.info(`Creating new food: meal ${meal.id}`)

    await bouncer.with('DietPolicy').authorize('update', diet)

    const data = await request.validateUsing(createFoodValidator)

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
  async update({ bouncer, params, request, response }: HttpContext) {
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    await bouncer.with('DietPolicy').authorize('update', diet)

    const data = await request.validateUsing(updateFoodValidator)

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
  async destroy({ bouncer, params, response }: HttpContext) {
    const meal = await Meal.query().where('id', params.mealId).preload('diet').firstOrFail()
    const diet = meal.diet
    const food = await Food.query().where('id', params.id).where('meal_id', meal.id).firstOrFail()

    await bouncer.with('DietPolicy').authorize('delete', diet)

    await food.delete()

    return response.ok({
      message: 'Food deleted successfully',
    })
  }
}
