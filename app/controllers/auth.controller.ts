import User from '#models/user.model'
import { registerValidator, loginValidator } from '#validators/auth.validator'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

export default class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  async register({ request, response }: HttpContext) {
    const email = request.input('email')
    logger.info(`Register attempt: ${email}`)

    // Validate request data
    const data = await request.validateUsing(registerValidator)

    // All registered users need approval (pending by default)
    const approved = false

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
      role: (data.role as any) || 'user', // super não pode ser definido via registro
      approved: approved,
      published: true,
    })

    // Generate token
    const token = await User.accessTokens.create(user)

    logger.info(`User registered successfully: ${user.id} - ${user.email}`)

    return response.created({
      message: 'User registered successfully. Access pending approval by gym administrator.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gym_id: user.gym_id,
        role: user.role,
        approved: user.approved,
      },
      token: token.value!.release(),
    })
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login({ request, response }: HttpContext) {
    const email = request.input('email')
    logger.info(`Login attempt: ${email}`)

    // Validate request data
    const { email: validatedEmail, password } = await request.validateUsing(loginValidator)

    // Verify credentials
    const user = await User.verifyCredentials(validatedEmail, password)

    // Check if user is approved to login
    if (!user.canLogin()) {
      logger.warn(`Login denied - user not approved: ${user.id}`)
      return response.forbidden({
        message: 'Your access is pending approval. Please contact a gym administrator.',
      })
    }

    // Generate token
    const token = await User.accessTokens.create(user)

    logger.info(`User logged in successfully: ${user.id} - ${user.email}`)

    return response.ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gym_id: user.gym_id,
        role: user.role,
      },
      token: token.value!.release(),
    })
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info(`Logout attempt: user ${user.id}`)

    // Delete current token
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    logger.info(`User logged out successfully: ${user.id}`)

    return response.ok({
      message: 'Logged out successfully',
    })
  }

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info(`Fetching authenticated user data: ${user.id}`)

    // Load gym relationship
    await user.load('gym')

    return response.ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birth_date: user.birth_date,
        phone: user.phone,
        cpf: user.cpf,
        gender: user.gender,
        profession: user.profession,
        address: user.address,
        gym_id: user.gym_id,
        diet_id: user.diet_id,
        role: user.role,
        approved: user.approved,
        published: user.published,
        gym: user.gym
          ? {
              id: user.gym.id,
              name: user.gym.name,
            }
          : null,
      },
    })
  }
}
