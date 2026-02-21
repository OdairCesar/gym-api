import Exercise from '#models/exercise.model'
import { createExerciseValidator, updateExerciseValidator } from '#validators/exercise.validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

/** Campos retornados quando o usuário é cliente */
function serializeExerciseLimited(exercise: Exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    type: exercise.type,
    _access: 'limited' as const,
  }
}

export default class ExercisesController {
  /**
   * List all exercises
   * Admins e personals recebem dados completos; clientes recebem payload limited.
   * GET /exercises
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing exercises: user ${currentUser.id}`)

    const page = request.input('page', 1)
    const limit = request.input('limit', 50)
    const search = request.input('search')
    const type = request.input('type')

    let query = Exercise.query()

    if (search) {
      query = query.whereILike('name', `%${search}%`)
    }
    if (type) {
      query = query.where('type', type)
    }

    const exercises = await query.orderBy('name', 'asc').paginate(page, limit)
    const list = exercises.all()

    const isFullUser = currentUser.role === 'admin' || currentUser.role === 'personal'
    const serialized = list.map((ex) =>
      isFullUser ? { ...ex.serialize(), _access: 'full' } : serializeExerciseLimited(ex)
    )

    return response.ok({
      data: {
        data: serialized,
        meta: exercises.getMeta(),
      },
    })
  }

  /**
   * Get single exercise by ID
   * Admins e personals recebem dados completos; clientes recebem payload limited.
   * GET /exercises/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching exercise details: exercise ${params.id}, user ${currentUser.id}`)

    const exercise = await Exercise.findOrFail(params.id)

    const isFullUser = currentUser.role === 'admin' || currentUser.role === 'personal'

    return response.ok({
      data: isFullUser
        ? { ...exercise.serialize(), _access: 'full' }
        : serializeExerciseLimited(exercise),
    })
  }

  /**
   * Create new exercise
   * POST /exercises
   */
  async create({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new exercise: user ${currentUser.id}`)

    // Only admin and personal can create exercises
    if (currentUser.role !== 'admin' && currentUser.role !== 'personal') {
      return response.forbidden({ message: 'Only admins and personals can create exercises' })
    }

    // Validate request data
    const data = await request.validateUsing(createExerciseValidator)

    // Create exercise
    const exercise = await Exercise.create({
      name: data.name,
      reps: data.reps || '3x12',
      type: data.type,
      weight: data.weight || 0,
      rest_seconds: data.restSeconds || 60,
      video_link: data.videoLink || null,
      priority: data.priority || 0,
    })

    logger.info(`Exercise created successfully: ${exercise.id}`)

    return response.created({
      message: 'Exercise created successfully',
      data: exercise.serialize(),
    })
  }

  /**
   * Update exercise
   * PUT/PATCH /exercises/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    // Only admin can update exercises (shared resource)
    if (currentUser.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can update exercises' })
    }

    const exercise = await Exercise.findOrFail(params.id)

    // Validate request data
    const data = await request.validateUsing(updateExerciseValidator)

    // Update exercise
    exercise.merge({
      name: data.name,
      reps: data.reps,
      type: data.type,
      weight: data.weight,
      rest_seconds: data.restSeconds,
      video_link: data.videoLink !== undefined ? data.videoLink : undefined,
      priority: data.priority,
    })

    await exercise.save()

    return response.ok({
      message: 'Exercise updated successfully',
      data: exercise.serialize(),
    })
  }

  /**
   * Delete exercise
   * DELETE /exercises/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    // Only admin can delete exercises (shared resource)
    if (currentUser.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can delete exercises' })
    }

    const exercise = await Exercise.findOrFail(params.id)

    await exercise.delete()

    return response.ok({
      message: 'Exercise deleted successfully',
    })
  }
}
