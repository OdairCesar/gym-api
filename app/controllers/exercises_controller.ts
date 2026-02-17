import Exercise from '#models/exercise'
import { createExerciseValidator, updateExerciseValidator } from '#validators/exercise_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class ExercisesController {
  /**
   * List all exercises
   * GET /exercises
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing exercises: user ${currentUser.id}`)

    // Only admin and personal can manage exercises
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can view exercises' })
    }

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 50)

    // Search
    const search = request.input('search')
    let query = Exercise.query()

    if (search) {
      query = query.whereILike('name', `%${search}%`)
    }

    // Filter by type
    const type = request.input('type')
    if (type) {
      query = query.where('type', type)
    }

    const exercises = await query.orderBy('name', 'asc').paginate(page, limit)

    return response.ok({
      data: exercises.serialize(),
    })
  }

  /**
   * Get single exercise by ID
   * GET /exercises/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching exercise details: exercise ${params.id}, user ${currentUser.id}`)

    // Only admin and personal can manage exercises
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can view exercises' })
    }

    const exercise = await Exercise.findOrFail(params.id)

    return response.ok({
      data: exercise.serialize(),
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
    if (!currentUser.is_admin && !currentUser.is_personal) {
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
    if (!currentUser.is_admin) {
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
    if (!currentUser.is_admin) {
      return response.forbidden({ message: 'Only admins can delete exercises' })
    }

    const exercise = await Exercise.findOrFail(params.id)

    await exercise.delete()

    return response.ok({
      message: 'Exercise deleted successfully',
    })
  }
}
