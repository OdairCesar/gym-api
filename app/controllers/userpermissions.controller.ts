import Userpermission from '#models/userpermission.model'
import User from '#models/user.model'
import Gym from '#models/gym.model'
import {
  createUserpermissionValidator,
  updateUserpermissionValidator,
} from '#validators/userpermission.validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class UserpermissionsController {
  /**
   * List all user permissions (client sees their own permissions)
   * GET /user-permissions
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing user permissions: user ${currentUser.id}`)

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    // Clients see their own permissions
    const permissions = await Userpermission.query()
      .where('user_id', currentUser.id)
      .orderBy('id', 'desc')
      .paginate(page, limit)

    return response.ok(permissions)
  }

  /**
   * Create user permission (client grants permission to personal or gym)
   * POST /user-permissions
   */
  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating user permission: user ${currentUser.id}`)

    const data = await request.validateUsing(createUserpermissionValidator)

    // Validate grantee exists
    if (data.granteeType === 'personal') {
      const personal = await User.find(data.granteeId)
      if (!personal || personal.role !== 'personal') {
        return response.badRequest({ message: 'Personal not found or invalid' })
      }
    } else if (data.granteeType === 'gym') {
      const gym = await Gym.find(data.granteeId)
      if (!gym) {
        return response.badRequest({ message: 'Gym not found' })
      }
    }

    // Check if permission already exists
    const existingPermission = await Userpermission.query()
      .where('user_id', currentUser.id)
      .where('grantee_type', data.granteeType)
      .where('grantee_id', data.granteeId)
      .first()

    if (existingPermission) {
      return response.conflict({
        message: 'Permission already exists',
        permission: existingPermission,
      })
    }

    // Create permission
    const permission = await Userpermission.create({
      user_id: currentUser.id,
      grantee_type: data.granteeType,
      grantee_id: data.granteeId,
      can_edit_diets: data.canEditDiets ?? false,
      can_edit_trainings: data.canEditTrainings ?? false,
      is_active: true,
    })

    logger.info(`User permission created successfully: ${permission.id}`)

    return response.created(permission)
  }

  /**
   * Show single user permission
   * GET /user-permissions/:id
   */
  async show({ bouncer, params, response }: HttpContext) {
    const permission = await Userpermission.findOrFail(params.id)

    await bouncer.with('UserpermissionPolicy').authorize('show', permission)

    return response.ok(permission)
  }

  /**
   * Update user permission (toggle permissions or activate/deactivate)
   * PUT/PATCH /user-permissions/:id
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    const permission = await Userpermission.findOrFail(params.id)

    await bouncer.with('UserpermissionPolicy').authorize('update', permission)

    const data = await request.validateUsing(updateUserpermissionValidator)

    permission.merge({
      can_edit_diets: data.canEditDiets ?? permission.can_edit_diets,
      can_edit_trainings: data.canEditTrainings ?? permission.can_edit_trainings,
      is_active: data.isActive ?? permission.is_active,
    })

    await permission.save()

    return response.ok(permission)
  }

  /**
   * Delete user permission (revoke access)
   * DELETE /user-permissions/:id
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const permission = await Userpermission.findOrFail(params.id)

    await bouncer.with('UserpermissionPolicy').authorize('delete', permission)

    await permission.delete()

    return response.noContent()
  }

  /**
   * List users who granted permissions to current personal/gym
   * GET /granted-to-me
   */
  async grantedToMe({ auth, bouncer, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    await bouncer.with('UserpermissionPolicy').authorize('grantedToMe')

    let permissions: Userpermission[] = []

    if (currentUser.role === 'personal') {
      // Personal sees clients who granted access to them
      permissions = await Userpermission.query()
        .where('grantee_type', 'personal')
        .where('grantee_id', currentUser.id)
        .where('is_active', true)
        .preload('user')
        .orderBy('id', 'desc')
    } else {
      // Admin/super sees clients who granted access to their gym
      permissions = await Userpermission.query()
        .where('grantee_type', 'gym')
        .where('grantee_id', currentUser.gym_id)
        .where('is_active', true)
        .preload('user')
        .orderBy('id', 'desc')
    }

    return response.ok(permissions)
  }
}
