import User, { UserRole } from '#models/user.model'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class SubscriptionPolicy extends BasePolicy {
  /**
   * Ver subscription
   * Apenas admin da academia ou super
   */
  view(user: User, gymId: number): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN && user.gym_id === gymId
  }

  /**
   * Gerenciar subscription (criar, atualizar, cancelar)
   * Apenas admin da academia ou super
   */
  manage(user: User, gymId: number): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN && user.gym_id === gymId
  }
}
