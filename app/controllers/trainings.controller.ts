import Training from '#models/training.model'
import { createTrainingValidator, updateTrainingValidator } from '#validators/training.validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission.service'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'

/** Campos retornados quando o usuÃ¡rio NÃƒO tem acesso completo */
function serializeLimited(training: Training) {
  return {
    id: training.id,
    name: training.name,
    coach_id: training.coach_id,
    is_reusable: training.is_reusable,
    _access: 'limited' as const,
  }
}

@inject()
export default class TrainingsController {
  constructor(protected permissionService: PermissionService) {}
  /**
   * List all trainings (filtered by gym and permissions) + reusable from other gyms
   * Full data for trainings the user has full access to; limited otherwise.
   * GET /trainings
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing trainings: user ${currentUser.id}`)

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    let query = Training.query().preload('gym').preload('coach').preload('user')

    if (currentUser.role === 'admin') {
      query = query.where((q) => {
        q.where('gym_id', currentUser.gym_id).orWhere('is_reusable', true)
      })
    } else if (currentUser.role === 'personal') {
      const permittedGymIds = await this.permissionService.getGymsWithPermissionForPersonal(
        currentUser.id,
        'trainings'
      )
      query = query.where((q) => {
        q.where('coach_id', currentUser.id)
          .orWhereIn('gym_id', [currentUser.gym_id, ...permittedGymIds])
          .orWhere('is_reusable', true)
      })
    } else {
      // Client: prÃ³prios treinos + reusÃ¡veis
      query = query.where((q) => {
        q.where('user_id', currentUser.id).orWhere('is_reusable', true)
      })
    }

    // Filter by user if provided (admin/personal only)
    const userId = request.input('user_id')
    if (userId && (currentUser.role === 'admin' || currentUser.role === 'personal')) {
      query = query.where('user_id', userId)
    }

    const trainings = await query.paginate(page, limit)
    const list = trainings.all()

    const fullAccessIds = await this.permissionService.getFullAccessResourceIds(
      currentUser,
      'training',
      list.map((t) => ({ id: t.id, gym_id: t.gym_id, coach_id: t.coach_id, user_id: t.user_id }))
    )

    const serialized = list.map((training) =>
      fullAccessIds.has(training.id)
        ? { ...training.serialize(), _access: 'full' }
        : serializeLimited(training)
    )

    return response.ok({
      data: {
        data: serialized,
        meta: trainings.getMeta(),
      },
    })
  }

  /**
   * Get single training by ID
   * Qualquer usuÃ¡rio autenticado pode acessar â€” payload full ou limited.
   * GET /trainings/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching training details: training ${params.id}, user ${currentUser.id}`)

    const training = await Training.query()
      .where('id', params.id)
      .preload('gym')
      .preload('coach')
      .preload('user')
      .preload('exercises')
      .firstOrFail()

    const hasFullAccess = await this.permissionService.hasFullAccessToResource(
      currentUser,
      'training',
      training.id,
      training.gym_id
    )

    if (hasFullAccess) {
      return response.ok({ data: { ...training.serialize(), _access: 'full' } })
    }

    return response.ok({ data: serializeLimited(training) })
  }

  /**
   * List all trainings marked as reusable (any gym)
   * GET /trainings/shared
   */
  async shared({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing shared/reusable trainings: user ${currentUser.id}`)

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search')

    let query = Training.query().where('is_reusable', true).preload('gym').preload('coach')

    if (search) {
      query = query.whereILike('name', `%${search}%`)
    }

    const trainings = await query.paginate(page, limit)
    const list = trainings.all()

    const fullAccessIds = await this.permissionService.getFullAccessResourceIds(
      currentUser,
      'training',
      list.map((t) => ({ id: t.id, gym_id: t.gym_id, coach_id: t.coach_id, user_id: t.user_id }))
    )

    const serialized = list.map((training) =>
      fullAccessIds.has(training.id)
        ? { ...training.serialize(), _access: 'full' }
        : serializeLimited(training)
    )

    return response.ok({
      data: {
        data: serialized,
        meta: trainings.getMeta(),
      },
    })
  }

  /**
   * Clone a reusable training into the current user's gym.
   * Duplica o treino (e seus exercÃ­cios) com gym_id do usuÃ¡rio autenticado.
   * POST /trainings/:id/clone
   */
  async clone({ auth, bouncer, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await bouncer.with('TrainingPolicy').authorize('create')

    const original = await Training.query()
      .where('id', params.id)
      .preload('exercises')
      .firstOrFail()

    // userId destino: admin/personal pode informar para qual cliente; padrÃ£o = sem usuÃ¡rio
    const targetUserId = request.input('user_id', null)

    const cloned = await Training.create({
      name: `${original.name} (cÃ³pia)`,
      description: original.description,
      gym_id: currentUser.gym_id,
      coach_id: currentUser.id,
      user_id: targetUserId ?? original.user_id,
      is_reusable: false,
    })

    // Clona os exercÃ­cios do pivot
    if (original.exercises?.length) {
      for (const exercise of original.exercises) {
        const pivot = exercise.$extras
        await cloned.related('exercises').attach({
          [exercise.id]: {
            name: pivot.pivot_name ?? exercise.name,
            reps: pivot.pivot_reps ?? exercise.reps,
            type: pivot.pivot_type ?? exercise.type,
            weight: pivot.pivot_weight ?? exercise.weight,
            rest_seconds: pivot.pivot_rest_seconds ?? exercise.rest_seconds,
            video_link: pivot.pivot_video_link ?? exercise.video_link,
            priority: pivot.pivot_priority ?? exercise.priority,
          },
        })
      }
    }

    await cloned.load('gym')
    await cloned.load('coach')
    await cloned.load('exercises')

    logger.info(`Training ${original.id} cloned to ${cloned.id} by user ${currentUser.id}`)

    return response.created({
      message: 'Training cloned successfully',
      data: cloned.serialize(),
    })
  }

  /**
   * Create new training
   * POST /trainings
   */
  async create({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new training: user ${currentUser.id}`)

    await bouncer.with('TrainingPolicy').authorize('create')

    const data = await request.validateUsing(createTrainingValidator)

    const training = await Training.create({
      name: data.name,
      description: data.description,
      user_id: data.userId,
      coach_id: currentUser.id,
      gym_id: currentUser.gym_id,
    })

    await training.load('gym')
    await training.load('coach')
    await training.load('user')

    logger.info(`Training created successfully: ${training.id}`)

    return response.created({
      message: 'Training created successfully',
      data: training.serialize(),
    })
  }

  /**
   * Update training
   * PUT/PATCH /trainings/:id
   */
  async update({ auth, bouncer, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const training = await Training.findOrFail(params.id)
    logger.info(`Updating training: ${training.id} by user ${currentUser.id}`)

    await bouncer.with('TrainingPolicy').authorize('update', training)

    const data = await request.validateUsing(updateTrainingValidator)

    training.merge({
      name: data.name,
      description: data.description,
      user_id: data.userId,
    })

    await training.save()
    await training.load('gym')
    await training.load('coach')
    await training.load('user')

    return response.ok({
      message: 'Training updated successfully',
      data: training.serialize(),
    })
  }

  /**
   * Delete training
   * DELETE /trainings/:id
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const training = await Training.findOrFail(params.id)

    await bouncer.with('TrainingPolicy').authorize('delete', training)

    await training.delete()

    return response.ok({ message: 'Training deleted successfully' })
  }

  /**
   * Add exercise to training (with customization)
   * POST /trainings/:id/exercises
   */
  async addExercise({ bouncer, params, request, response }: HttpContext) {
    const training = await Training.findOrFail(params.id)

    await bouncer.with('TrainingPolicy').authorize('update', training)

    const data = request.only([
      'exercise_id',
      'name',
      'reps',
      'type',
      'weight',
      'rest_seconds',
      'video_link',
      'priority',
    ])

    await training.related('exercises').attach({
      [data.exercise_id]: {
        name: data.name,
        reps: data.reps,
        type: data.type,
        weight: data.weight,
        rest_seconds: data.rest_seconds,
        video_link: data.video_link,
        priority: data.priority || 0,
      },
    })

    await training.load('exercises')

    return response.ok({
      message: 'Exercise added to training successfully',
      data: training.serialize(),
    })
  }

  /**
   * Remove exercise from training
   * DELETE /trainings/:id/exercises/:exerciseId
   */
  async removeExercise({ bouncer, params, response }: HttpContext) {
    const training = await Training.findOrFail(params.id)

    await bouncer.with('TrainingPolicy').authorize('update', training)

    await training.related('exercises').detach([params.exerciseId])

    return response.ok({ message: 'Exercise removed from training successfully' })
  }
}
