import User from '#models/user'
import Gym from '#models/gym'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class GymPolicy extends BasePolicy {
  /**
   * Qualquer usuário pode ver lista de academias
   */
  index(_user: User): AuthorizerResponse {
    return true
  }

  /**
   * Qualquer usuário pode ver detalhes de uma academia
   */
  show(_user: User, _gym: Gym): AuthorizerResponse {
    return true
  }

  /**
   * Apenas super admins podem criar academias
   * (isso seria gerenciado externamente, aqui bloqueamos por padrão)
   */
  create(_user: User): AuthorizerResponse {
    return false
  }

  /**
   * Apenas admins podem atualizar sua própria academia
   */
  update(user: User, gym: Gym): AuthorizerResponse {
    if (!user.is_admin) {
      return false
    }

    return user.gym_id === gym.id
  }

  /**
   * Apenas super admins podem deletar academias
   * (bloqueado por padrão)
   */
  delete(_user: User, _gym: Gym): AuthorizerResponse {
    return false
  }
}
