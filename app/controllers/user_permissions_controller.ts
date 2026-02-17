import UserPermission from '#models/user_permission'
import User from '#models/user'
import Gym from '#models/gym'
import {
  createUserPermissionValidator,
  updateUserPermissionValidator,
} from '#validators/user_permission_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class UserPermissionsController {
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
    const permissions = await UserPermission.query()
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

    const data = await request.validateUsing(createUserPermissionValidator)

    // Validate grantee exists
    if (data.granteeType === 'personal') {
      const personal = await User.find(data.granteeId)
      if (!personal || !personal.is_personal) {
        return response.badRequest({ message: 'Personal not found or invalid' })
      }
    } else if (data.granteeType === 'gym') {
      const gym = await Gym.find(data.granteeId)
      if (!gym) {
        return response.badRequest({ message: 'Gym not found' })
      }
    }

    // Check if permission already exists
    const existingPermission = await UserPermission.query()
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
    const permission = await UserPermission.create({
      user_id: currentUser.id,
      grantee_type: data.granteeType,
      grantee_id: data.granteeId,
      can_edit_diet: data.canEditDiet ?? false,
      can_edit_training: data.canEditTraining ?? false,
      is_active: true,
    })

    logger.info(`User permission created successfully: ${permission.id}`)

    return response.created(permission)
  }

  /**
   * Show single user permission
   * GET /user-permissions/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching user permission details: permission ${params.id}, user ${currentUser.id}`)

    const permission = await UserPermission.findOrFail(params.id)

    // Only owner can view
    if (permission.user_id !== currentUser.id) {
      return response.forbidden({ message: 'You do not have permission to view this' })
    }

    return response.ok(permission)
  }

  /**
   * Update user permission (toggle permissions or activate/deactivate)
   * PUT/PATCH /user-permissions/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const permission = await UserPermission.findOrFail(params.id)

    // Only owner can update
    if (permission.user_id !== currentUser.id) {
      return response.forbidden({ message: 'You do not have permission to update this' })
    }

    const data = await request.validateUsing(updateUserPermissionValidator)

    permission.merge({
      can_edit_diet: data.canEditDiet ?? permission.can_edit_diet,
      can_edit_training: data.canEditTraining ?? permission.can_edit_training,
      is_active: data.isActive ?? permission.is_active,
    })

    await permission.save()

    return response.ok(permission)
  }

  /**
   * Delete user permission (revoke access)
   * DELETE /user-permissions/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const permission = await UserPermission.findOrFail(params.id)

    // Only owner can delete
    if (permission.user_id !== currentUser.id) {
      return response.forbidden({ message: 'You do not have permission to delete this' })
    }

    await permission.delete()

    return response.noContent()
  }

  /**
   * List users who granted permissions to current personal/gym
   * GET /granted-to-me
   */
  async grantedToMe({ auth, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    let permissions: UserPermission[] = []

    if (currentUser.is_personal) {
      // Personal sees clients who granted access to them
      permissions = await UserPermission.query()
        .where('grantee_type', 'personal')
        .where('grantee_id', currentUser.id)
        .where('is_active', true)
        .preload('user')
        .orderBy('id', 'desc')
    } else if (currentUser.is_admin) {
      // Admin sees clients who granted access to their gym
      permissions = await UserPermission.query()
        .where('grantee_type', 'gym')
        .where('grantee_id', currentUser.gym_id)
        .where('is_active', true)
        .preload('user')
        .orderBy('id', 'desc')
    } else {
      return response.forbidden({
        message: 'Only personals and admins can view granted permissions',
      })
    }

    return response.ok(permissions)
  }
}
