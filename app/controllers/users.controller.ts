import User from '#models/user.model'
import { createUserValidator, updateUserValidator } from '#validators/user.validator'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'
import PlanLimitService from '#services/plan_limit.service'

@inject()
export default class UsersController {
  constructor(protected planLimitService: PlanLimitService) {}
  /**
   * List all users (filtered by gym)
   * GET /users
   */
  async index({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing users: user ${currentUser.id}, gym ${currentUser.gym_id}`)

    // Check authorization
    await bouncer.with('UserPolicy').authorize('index')

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    // Query
    let query = User.query().preload('gym')

    // Users can only see users from their own gym
    query = query.where('gym_id', currentUser.gym_id)

    // Filter by type if provided
    const type = request.input('type') // 'admin', 'personal', 'user'
    if (type === 'admin') {
      query = query.where('role', 'admin')
    } else if (type === 'personal') {
      query = query.where('role', 'personal')
    } else if (type === 'client') {
      query = query.where('role', 'user')
    }

    // Filter by published status
    const published = request.input('published')
    if (published !== undefined) {
      query = query.where('published', published === 'true')
    }

    // Search by name or email
    const search = request.input('search')
    if (search) {
      query = query.where((subQuery) => {
        subQuery.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`)
      })
    }

    const users = await query.paginate(page, limit)

    return response.ok({
      data: users.serialize(),
    })
  }

  /**
   * Get single user by ID
   * GET /users/:id
   */
  async show({ bouncer, params, response }: HttpContext) {
    logger.info(`Fetching user details: ${params.id}`)

    const user = await User.findOrFail(params.id)

    // Check authorization
    await bouncer.with('UserPolicy').authorize('show', user)

    // Load relationships
    await user.load('gym')
    if (user.diet_id) {
      await user.load('diet')
    }

    return response.ok({
      data: user.serialize(),
    })
  }

  /**
   * Create new user
   * POST /users
   */
  async create({ auth, bouncer, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new user: by user ${currentUser.id}`)

    // Check authorization
    await bouncer.with('UserPolicy').authorize('create')

    // Validate request data
    const data = await request.validateUsing(createUserValidator)

    // Always force gym_id to be the same as current user's gym (multi-tenant)
    data.gymId = currentUser.gym_id

    // Verificar limite de usuários do plano
    const limitCheck = await this.planLimitService.canAddUser(data.gymId)
    if (!limitCheck.allowed) {
      return response.paymentRequired({
        message: 'Limite de usuários do plano atingido. Faça upgrade para adicionar mais usuários.',
        current_users: limitCheck.current,
        plan_limit: limitCheck.max,
        upgrade_url: '/gym-plans',
      })
    }

    // Determine if new user should be auto-approved
    let approved = false
    let approvedBy = null
    let approvedAt = null

    // Super users can create approved users
    if (currentUser.role === 'super') {
      approved = true
      approvedBy = currentUser.id
      approvedAt = DateTime.now()
    }
    // Approved admins or personals can create approved users in their gym
    else if (
      (currentUser.role === 'admin' || currentUser.role === 'personal') &&
      currentUser.approved
    ) {
      approved = true
      approvedBy = currentUser.id
      approvedAt = DateTime.now()
    }
    // Otherwise, user needs approval

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      birth_date: data.birthDate ? DateTime.fromJSDate(data.birthDate) : null,
      phone: data.phone,
      cpf: data.cpf,
      gender: data.gender,
      profession: data.profession,
      address: data.address,
      gym_id: data.gymId,
      diet_id: data.dietId,
      role: (data.role as any) || 'user',
      approved: approved,
      approved_by: approvedBy,
      approved_at: approvedAt,
      published: data.published !== undefined ? data.published : true,
    })

    await user.load('gym')

    logger.info(`User created successfully: ${user.id} - ${user.email}`)

    const message = approved
      ? 'User created successfully'
      : 'User created successfully. User access pending approval.'

    return response.created({
      message,
      data: user.serialize(),
    })
  }

  /**
   * Update user
   * PUT/PATCH /users/:id
   */
  async update({ auth, bouncer, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const user = await User.findOrFail(params.id)
    logger.info(`Updating user: ${user.id} by user ${currentUser.id}`)

    // Check authorization
    await bouncer.with('UserPolicy').authorize('update', user)

    // Validate request data (with meta for unique validation)
    const data = await request.validateUsing(updateUserValidator, {
      meta: { userId: user.id },
    })

    // Never allow changing gym_id (multi-tenant - users are bound to their gym)
    delete data.gymId

    // Prevent changing role unless admin or super
    if (currentUser.role !== 'admin' && currentUser.role !== 'super') {
      delete data.role
    }

    // Update user
    user.merge({
      name: data.name,
      email: data.email,
      password: data.password,
      birth_date: data.birthDate ? DateTime.fromJSDate(data.birthDate) : undefined,
      phone: data.phone,
      cpf: data.cpf,
      gender: data.gender,
      profession: data.profession,
      address: data.address,
      gym_id: data.gymId,
      diet_id: data.dietId,
      role: data.role as any,
      published: data.published,
    })

    await user.save()
    await user.load('gym')

    logger.info(`User updated successfully: ${user.id}`)

    return response.ok({
      message: 'User updated successfully',
      data: user.serialize(),
    })
  }

  /**
   * Delete user
   * DELETE /users/:id
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    logger.info(`Deleting user: ${user.id}`)

    // Check authorization
    await bouncer.with('UserPolicy').authorize('delete', user)

    await user.delete()

    logger.info(`User deleted successfully: ${user.id}`)

    return response.ok({
      message: 'User deleted successfully',
    })
  }

  /**
   * List pending user approvals
   * GET /users/pending-users
   */
  async pendingUsers({ auth, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing pending users: user ${currentUser.id}`)

    // Only approved admins/personals and supers can see pending users
    if (currentUser.role === 'super') {
      // Super can see all
    } else if (
      (currentUser.role === 'admin' || currentUser.role === 'personal') &&
      currentUser.approved
    ) {
      // Approved admins/personals can see from their gym
    } else {
      return response.forbidden({
        message: 'Only approved admins or personals can view pending user approvals',
      })
    }

    // Supers can see all pending users, others only from their gym
    let query = User.query().where('approved', false).preload('gym')

    if (currentUser.role !== 'super') {
      query = query.where('gym_id', currentUser.gym_id)
    }

    const pendingUsers = await query.orderBy('created_at', 'desc')

    return response.ok({
      data: pendingUsers.map((user) => user.serialize()),
    })
  }

  /**
   * Approve user
   * POST /users/:id/approve-user
   */
  async approveUser({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const user = await User.findOrFail(params.id)
    logger.info(`Approving user: ${user.id} by user ${currentUser.id}`)

    // Only approved admins/personals of the same gym or supers can approve
    if (currentUser.role === 'super') {
      // Super can approve any user
    } else if (
      (currentUser.role === 'admin' || currentUser.role === 'personal') &&
      currentUser.approved
    ) {
      // Admin/personal can only approve from their gym
      if (user.gym_id !== currentUser.gym_id) {
        return response.forbidden({ message: 'You can only approve users from your gym' })
      }
    } else {
      return response.forbidden({
        message: 'Only approved admins/personals or super users can approve user access',
      })
    }

    // Check if user is actually pending
    if (user.approved) {
      return response.badRequest({ message: 'User is already approved' })
    }

    // Approve the user
    user.approved = true
    user.approved_by = currentUser.id
    user.approved_at = DateTime.now()
    await user.save()

    await user.load('gym')
    await user.load('approver')

    logger.info(`User approved successfully: ${user.id}`)

    return response.ok({
      message: 'User access approved successfully',
      data: user.serialize(),
    })
  }

  /**
   * Reject user (delete pending user)
   * POST /users/:id/reject-user
   */
  async rejectUser({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const user = await User.findOrFail(params.id)
    logger.info(`Rejecting user: ${user.id} by user ${currentUser.id}`)

    // Only approved admins/personals of the same gym or supers can reject
    if (currentUser.role === 'super') {
      // Super can reject any user
    } else if (
      (currentUser.role === 'admin' || currentUser.role === 'personal') &&
      currentUser.approved
    ) {
      // Admin/personal can only reject from their gym
      if (user.gym_id !== currentUser.gym_id) {
        return response.forbidden({ message: 'You can only reject users from your gym' })
      }
    } else {
      return response.forbidden({
        message: 'Only approved admins/personals or super users can reject user access',
      })
    }

    // Check if user is actually pending
    if (user.approved) {
      return response.badRequest({
        message: 'Cannot reject already approved user. Use delete or update instead.',
      })
    }

    // Reject by deleting the pending user
    await user.delete()

    logger.info(`User rejected successfully: ${user.id}`)

    return response.ok({
      message: 'User registration rejected and deleted successfully',
    })
  }
}
