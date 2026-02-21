import User, { UserRole } from '#models/user.model'
import Gym from '#models/gym.model'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class GymPolicy extends BasePolicy {
  index(_user: User): AuthorizerResponse {
    return true
  }

  show(_user: User, _gym: Gym): AuthorizerResponse {
    return true
  }

  /** Apenas super admins podem criar academias */
  create(user: User): AuthorizerResponse {
    return user.role === UserRole.SUPER
  }

  /** Admins podem atualizar sua própria academia; super pode qualquer uma */
  update(user: User, gym: Gym): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN && user.gym_id === gym.id
  }

  /** Apenas super admins podem deletar academias */
  delete(user: User, _gym: Gym): AuthorizerResponse {
    return user.role === UserRole.SUPER
  }
}
