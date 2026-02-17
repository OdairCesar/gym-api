import Training from '#models/training'
import { createTrainingValidator, updateTrainingValidator } from '#validators/training_validator'
import { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#services/permission_service'
import logger from '@adonisjs/core/services/logger'

export default class TrainingsController {
  /**
   * List all trainings (filtered by gym and permissions)
   * GET /trainings
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing trainings: user ${currentUser.id}`)

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    // Query
    let query = Training.query().preload('gym').preload('coach').preload('user')

    // Admins see all trainings from their gym
    // Personals see trainings they created + trainings from gyms they have permission
    // Clients see only their trainings
    if (currentUser.is_admin) {
      query = query.where('gym_id', currentUser.gym_id)
    } else if (currentUser.is_personal) {
      // Get gyms where personal has permission
      const permittedGymIds = await PermissionService.getGymsWithPermissionForPersonal(
        currentUser.id,
        'trainings'
      )

      query = query.where((subQuery) => {
        subQuery
          .where('coach_id', currentUser.id)
          .orWhereIn('gym_id', [currentUser.gym_id, ...permittedGymIds])
      })
    } else {
      // Client sees only their trainings
      query = query.where('user_id', currentUser.id)
    }

    // Filter by user if provided (admin/personal only)
    const userId = request.input('user_id')
    if (userId && (currentUser.is_admin || currentUser.is_personal)) {
      query = query.where('user_id', userId)
    }

    const trainings = await query.paginate(page, limit)

    return response.ok({
      data: trainings.serialize(),
    })
  }

  /**
   * Get single training by ID
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

    // Check if user can view this training
    const canView =
      (currentUser.is_admin && currentUser.gym_id === training.gym_id) ||
      (currentUser.is_personal &&
        (training.coach_id === currentUser.id ||
          (await PermissionService.canEditTrainingById(currentUser.id, training.id)))) ||
      training.user_id === currentUser.id

    if (!canView) {
      return response.forbidden({ message: 'You do not have permission to view this training' })
    }

    return response.ok({
      data: training.serialize(),
    })
  }

  /**
   * Create new training
   * POST /trainings
   */
  async create({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new training: user ${currentUser.id}`)

    // Only admin and personal can create trainings
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can create trainings' })
    }

    // Validate request data
    const data = await request.validateUsing(createTrainingValidator)

    // Create training
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
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const training = await Training.findOrFail(params.id)
    logger.info(`Updating training: ${training.id} by user ${currentUser.id}`)

    // Check permission
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === training.gym_id) ||
      (currentUser.is_personal &&
        (training.coach_id === currentUser.id ||
          (await PermissionService.canEditTrainingById(currentUser.id, training.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this training' })
    }

    // Validate request data
    const data = await request.validateUsing(updateTrainingValidator)

    // Update training
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
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const training = await Training.findOrFail(params.id)

    // Check permission
    const canDelete =
      (currentUser.is_admin && currentUser.gym_id === training.gym_id) ||
      (currentUser.is_personal && training.coach_id === currentUser.id)

    if (!canDelete) {
      return response.forbidden({
        message: 'You do not have permission to delete this training',
      })
    }

    await training.delete()

    return response.ok({
      message: 'Training deleted successfully',
    })
  }

  /**
   * Add exercise to training (with customization)
   * POST /trainings/:id/exercises
   */
  async addExercise({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const training = await Training.findOrFail(params.id)

    // Check permission
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === training.gym_id) ||
      (currentUser.is_personal &&
        (training.coach_id === currentUser.id ||
          (await PermissionService.canEditTrainingById(currentUser.id, training.id))))

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this training' })
    }

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

    // Attach exercise with pivot data
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
  async removeExercise({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const training = await Training.findOrFail(params.id)

    // Check permission
    const canEdit =
      (currentUser.is_admin && currentUser.gym_id === training.gym_id) ||
      (currentUser.is_personal && training.coach_id === currentUser.id)

    if (!canEdit) {
      return response.forbidden({ message: 'You do not have permission to edit this training' })
    }

    // Detach exercise
    await training.related('exercises').detach([params.exerciseId])

    return response.ok({
      message: 'Exercise removed from training successfully',
    })
  }
}
