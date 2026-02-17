import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserPolicy extends BasePolicy {
  /**
   * Usuários podem ver lista de usuários da sua própria academia
   */
  index(_user: User): AuthorizerResponse {
    return true // Filtrado no controller por gym_id
  }

  /**
   * Usuários podem ver detalhes de usuários da sua academia
   */
  show(user: User, targetUser: User): AuthorizerResponse {
    // Todos os usuários só veem da mesma academia
    return user.isInSameGym(targetUser)
  }

  /**
   * Apenas admins e personals podem criar usuários (na sua academia)
   */
  create(user: User): AuthorizerResponse {
    return user.is_admin || user.is_personal
  }

  /**
   * Regras para atualizar usuário (MULTI-TENANT):
   * - Pode atualizar a si mesmo
   * - Admins podem atualizar qualquer um DA SUA ACADEMIA
   * - Personals podem atualizar apenas users comuns DA SUA ACADEMIA
   */
  update(user: User, targetUser: User): AuthorizerResponse {
    // Pode atualizar a si mesmo
    if (user.id === targetUser.id) {
      return true
    }

    // Precisa ser da mesma academia
    if (!user.isInSameGym(targetUser)) {
      return false
    }

    // Admins podem atualizar qualquer um da sua academia
    if (user.is_admin) {
      return true
    }

    // Personals podem atualizar apenas users comuns da sua academia
    if (user.is_personal) {
      return !targetUser.is_admin && !targetUser.is_personal
    }

    return false
  }

  /**
   * Regras para deletar usuário (MULTI-TENANT):
   * - Admins podem deletar qualquer um DA SUA ACADEMIA
   * - Personals podem deletar apenas users comuns DA SUA ACADEMIA
   */
  delete(user: User, targetUser: User): AuthorizerResponse {
    // Precisa ser da mesma academia
    if (!user.isInSameGym(targetUser)) {
      return false
    }

    // Admins podem deletar qualquer um da sua academia
    if (user.is_admin) {
      return true
    }

    // Personals podem deletar apenas users comuns da sua academia
    if (user.is_personal) {
      return !targetUser.is_admin && !targetUser.is_personal
    }

    return false
  }
}
