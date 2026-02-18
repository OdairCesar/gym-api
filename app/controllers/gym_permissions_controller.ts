import GymPermission from '#models/gym_permission'
import User from '#models/user'
import {
  createGymPermissionValidator,
  updateGymPermissionValidator,
} from '#validators/gym_permission_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class GymPermissionsController {
  /**
   * List all gym permissions (admin sees permissions of their gym)
   * GET /gym-permissions
   */
  async index({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing gym permissions: user ${currentUser.id}, gym ${currentUser.gym_id}`)

    await bouncer.with('GymPermissionPolicy').authorize('index')

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const permissions = await GymPermission.query()
      .where('gym_id', currentUser.gym_id)
      .preload('personal')
      .orderBy('id', 'desc')
      .paginate(page, limit)

    return response.ok(permissions)
  }

  /**
   * Create gym permission (admin grants permission to external personal)
   * POST /gym-permissions
   */
  async store({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating gym permission: user ${currentUser.id}, gym ${currentUser.gym_id}`)

    await bouncer.with('GymPermissionPolicy').authorize('create')

    const data = await request.validateUsing(createGymPermissionValidator)

    // Check if personal exists and is a personal
    const personal = await User.find(data.personalId)
    if (!personal || personal.role !== 'personal') {
      return response.badRequest({ message: 'Personal not found or invalid' })
    }

    // Check if permission already exists
    const existingPermission = await GymPermission.query()
      .where('gym_id', currentUser.gym_id)
      .where('personal_id', data.personalId)
      .first()

    if (existingPermission) {
      return response.conflict({
        message: 'Permission already exists for this personal',
        permission: existingPermission,
      })
    }

    // Create permission
    const permission = await GymPermission.create({
      gym_id: currentUser.gym_id,
      personal_id: data.personalId,
      can_edit_diets: data.canEditDiets ?? false,
      can_edit_trainings: data.canEditTrainings ?? false,
      is_active: true,
    })

    await permission.load('personal')

    logger.info(`Gym permission created successfully: ${permission.id}`)

    return response.created(permission)
  }

  /**
   * Show single gym permission
   * GET /gym-permissions/:id
   */
  async show({ auth, bouncer, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching gym permission details: permission ${params.id}, user ${currentUser.id}`)

    const permission = await GymPermission.query()
      .where('id', params.id)
      .preload('personal')
      .firstOrFail()

    await bouncer.with('GymPermissionPolicy').authorize('show', permission)

    return response.ok(permission)
  }

  /**
   * Update gym permission (toggle permissions or activate/deactivate)
   * PUT/PATCH /gym-permissions/:id
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    const permission = await GymPermission.findOrFail(params.id)

    await bouncer.with('GymPermissionPolicy').authorize('update', permission)

    const data = await request.validateUsing(updateGymPermissionValidator)

    permission.merge({
      can_edit_diets: data.canEditDiets ?? permission.can_edit_diets,
      can_edit_trainings: data.canEditTrainings ?? permission.can_edit_trainings,
      is_active: data.isActive ?? permission.is_active,
    })

    await permission.save()
    await permission.load('personal')

    return response.ok(permission)
  }

  /**
   * Delete gym permission
   * DELETE /gym-permissions/:id
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const permission = await GymPermission.findOrFail(params.id)

    await bouncer.with('GymPermissionPolicy').authorize('delete', permission)

    await permission.delete()

    return response.noContent()
  }

  /**
   * List gyms where current personal has permissions
   * GET /my-gym-permissions
   */
  async myPermissions({ auth, bouncer, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await bouncer.with('GymPermissionPolicy').authorize('viewMyPermissions')

    const permissions = await GymPermission.query()
      .where('personal_id', currentUser.id)
      .where('is_active', true)
      .preload('gym')
      .orderBy('id', 'desc')

    return response.ok(permissions)
  }
}
