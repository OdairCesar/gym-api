import Meal from '#models/meal'
import Diet from '#models/diet'
import { createMealValidator, updateMealValidator } from '#validators/meal_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class MealsController {
  /**
   * List all meals from a diet
   * GET /diets/:dietId/meals
   */
  async index({ bouncer, params, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.dietId)

    await bouncer.with('DietPolicy').authorize('update', diet)

    const meals = await Meal.query().where('diet_id', diet.id).preload('foods').orderBy('id', 'asc')

    return response.ok({
      data: meals.map((meal) => meal.serialize()),
    })
  }

  /**
   * Get single meal by ID
   * GET /diets/:dietId/meals/:id
   */
  async show({ bouncer, params, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.dietId)

    const meal = await Meal.query()
      .where('id', params.id)
      .where('diet_id', diet.id)
      .preload('foods')
      .firstOrFail()

    await bouncer.with('DietPolicy').authorize('update', diet)

    return response.ok({
      data: meal.serialize(),
    })
  }

  /**
   * Create new meal in a diet
   * POST /diets/:dietId/meals
   */
  async create({ bouncer, params, request, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.dietId)
    logger.info(`Creating new meal: diet ${diet.id}`)

    await bouncer.with('DietPolicy').authorize('update', diet)

    const data = await request.validateUsing(createMealValidator)

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
  async update({ bouncer, params, request, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.dietId)
    const meal = await Meal.query().where('id', params.id).where('diet_id', diet.id).firstOrFail()

    await bouncer.with('DietPolicy').authorize('update', diet)

    const data = await request.validateUsing(updateMealValidator)

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
  async destroy({ bouncer, params, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.dietId)
    const meal = await Meal.query().where('id', params.id).where('diet_id', diet.id).firstOrFail()

    await bouncer.with('DietPolicy').authorize('delete', diet)

    await meal.delete()

    return response.ok({
      message: 'Meal deleted successfully',
    })
  }
}
