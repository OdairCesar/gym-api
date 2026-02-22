import Diet from '#models/diet.model'
import Meal from '#models/meal.model'
import Food from '#models/food.model'
import { createDietValidator, updateDietValidator } from '#validators/diet.validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission.service'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'

/** Campos retornados quando o usuÃ¡rio NÃƒO tem acesso completo */
function serializeLimited(diet: Diet) {
  return {
    id: diet.id,
    name: diet.name,
    calories: diet.calories,
    is_reusable: diet.is_reusable,
    _access: 'limited' as const,
  }
}

@inject()
export default class DietsController {
  constructor(protected permissionService: PermissionService) {}
  /**
   * List all diets (filtered by gym and permissions) + reusable from other gyms
   * Full data for diets the user has full access to; limited otherwise.
   * GET /diets
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing diets: user ${currentUser.id}`)

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const userIdFilter = request.input('user_id') // Filtrar por usuário (que tem a dieta atribuída)
    const creatorIdFilter = request.input('creator_id') // Filtrar por criador (personal/admin)

    // Build query: accessÃ­veis + reusable de outras gyms
    let query = Diet.query().preload('gym').preload('criador')

    if (currentUser.role === 'admin') {
      // Admin vê tudo da sua gym + reutilizáveis de outras gyms
      query = query.where((q) => {
        q.where('gym_id', currentUser.gym_id).orWhere('is_reusable', true)
      })
    } else if (currentUser.role === 'personal') {
      const permittedGymIds = await this.permissionService.getGymsWithPermissionForPersonal(
        currentUser.id,
        'diets'
      )
      query = query.where((q) => {
        q.where('creator_id', currentUser.id)
          .orWhereIn('gym_id', [currentUser.gym_id, ...permittedGymIds])
          .orWhere('is_reusable', true)
      })
    } else {
      // Client: prÃ³pria dieta + reusÃ¡veis (para facilitar busca/consulta)
      if (currentUser.diet_id) {
        query = query.where((q) => {
          q.where('id', currentUser.diet_id!).orWhere('is_reusable', true)
        })
      } else {
        query = query.where('is_reusable', true)
      }
    }

    // Filter by user_id (admin/personal only) - usuário que tem a dieta atribuída
    if (userIdFilter && (currentUser.role === 'admin' || currentUser.role === 'personal')) {
      query = query.whereHas('users', (usersQuery) => {
        usersQuery.where('id', userIdFilter)
      })
    }

    // Filter by creator_id (admin/personal/super only) - quem criou a dieta
    if (
      creatorIdFilter &&
      (currentUser.role === 'admin' ||
        currentUser.role === 'personal' ||
        currentUser.role === 'super')
    ) {
      query = query.andWhere('creator_id', creatorIdFilter)
    }

    const diets = await query.paginate(page, limit)
    const dietsList = diets.all()

    // Batch check: quais IDs têm acesso completo
    const fullAccessIds = await this.permissionService.getFullAccessResourceIds(
      currentUser,
      'diet',
      dietsList.map((d) => ({ id: d.id, gym_id: d.gym_id, creator_id: d.creator_id }))
    )

    const serialized = dietsList.map((diet) =>
      fullAccessIds.has(diet.id) ? { ...diet.serialize(), _access: 'full' } : serializeLimited(diet)
    )

    return response.ok({
      data: {
        data: serialized,
        meta: diets.getMeta(),
      },
    })
  }

  /**
   * Get single diet by ID
   * Qualquer usuÃ¡rio autenticado pode acessar â€” payload full ou limited.
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

    const hasFullAccess = await this.permissionService.hasFullAccessToResource(
      currentUser,
      'diet',
      diet.id,
      diet.gym_id
    )

    if (hasFullAccess) {
      return response.ok({ data: { ...diet.serialize(), _access: 'full' } })
    }

    return response.ok({ data: serializeLimited(diet) })
  }

  /**
   * List all diets marked as reusable (any gym)
   * GET /diets/shared
   */
  async shared({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing shared/reusable diets: user ${currentUser.id}`)

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search')

    let query = Diet.query().where('is_reusable', true).preload('gym').preload('criador')

    if (search) {
      query = query.whereILike('name', `%${search}%`)
    }

    const diets = await query.paginate(page, limit)
    const dietsList = diets.all()

    const fullAccessIds = await this.permissionService.getFullAccessResourceIds(
      currentUser,
      'diet',
      dietsList.map((d) => ({ id: d.id, gym_id: d.gym_id, creator_id: d.creator_id }))
    )

    const serialized = dietsList.map((diet) =>
      fullAccessIds.has(diet.id) ? { ...diet.serialize(), _access: 'full' } : serializeLimited(diet)
    )

    return response.ok({
      data: {
        data: serialized,
        meta: diets.getMeta(),
      },
    })
  }

  /**
   * Clone a reusable diet into the current user's gym.
   * Duplica a dieta (e suas meals + foods) com gym_id do usuÃ¡rio autenticado.
   * POST /diets/:id/clone
   */
  async clone({ auth, bouncer, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await bouncer.with('DietPolicy').authorize('create')

    const original = await Diet.query()
      .where('id', params.id)
      .preload('meals', (q) => q.preload('foods'))
      .firstOrFail()

    // Clona a dieta
    const cloned = await Diet.create({
      name: `${original.name} (cÃ³pia)`,
      description: original.description,
      calories: original.calories,
      proteins: original.proteins,
      carbohydrates: original.carbohydrates,
      fats: original.fats,
      gym_id: currentUser.gym_id,
      creator_id: currentUser.id,
      is_reusable: false,
    })

    // Clona meals e foods
    for (const meal of original.meals ?? []) {
      const clonedMeal = await Meal.create({
        diet_id: cloned.id,
        name: meal.name,
        description: meal.description,
        hourly: meal.hourly,
      })

      for (const food of meal.foods ?? []) {
        await Food.create({
          meal_id: clonedMeal.id,
          name: food.name,
        })
      }
    }

    await cloned.load('gym')
    await cloned.load('criador')

    logger.info(`Diet ${original.id} cloned to ${cloned.id} by user ${currentUser.id}`)

    return response.created({
      message: 'Diet cloned successfully',
      data: cloned.serialize(),
    })
  }

  /**
   * Create new diet
   * POST /diets
   */
  async create({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new diet: user ${currentUser.id}`)

    await bouncer.with('DietPolicy').authorize('create')

    const data = await request.validateUsing(createDietValidator)

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
  async update({ auth, bouncer, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const diet = await Diet.findOrFail(params.id)
    logger.info(`Updating diet: ${diet.id} by user ${currentUser.id}`)

    await bouncer.with('DietPolicy').authorize('update', diet)

    const data = await request.validateUsing(updateDietValidator)

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
  async destroy({ bouncer, params, response }: HttpContext) {
    const diet = await Diet.findOrFail(params.id)

    await bouncer.with('DietPolicy').authorize('delete', diet)

    await diet.delete()

    return response.ok({ message: 'Diet deleted successfully' })
  }
}
