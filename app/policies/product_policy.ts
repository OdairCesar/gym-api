import User from '#models/user'
import Product from '#models/product'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ProductPolicy extends BasePolicy {
  /**
   * Usuários podem ver produtos (filtrado por gym_id no controller)
   */
  index(_user: User): AuthorizerResponse {
    return true
  }

  /**
   * Usuários podem ver produtos da sua academia
   */
  show(user: User, product: Product): AuthorizerResponse {
    // Só pode ver produtos da sua academia
    return user.gym_id === product.gym_id
  }

  /**
   * Apenas admins e personals podem criar produtos (na sua academia)
   */
  create(user: User): AuthorizerResponse {
    return user.is_admin || user.is_personal
  }

  /**
   * Apenas admins e personals podem atualizar produtos DA SUA ACADEMIA
   */
  update(user: User, product: Product): AuthorizerResponse {
    // Precisa ser da mesma academia
    if (user.gym_id !== product.gym_id) {
      return false
    }

    return user.is_admin || user.is_personal
  }

  /**
   * Apenas admins e personals podem deletar produtos DA SUA ACADEMIA
   */
  delete(user: User, product: Product): AuthorizerResponse {
    // Precisa ser da mesma academia
    if (user.gym_id !== product.gym_id) {
      return false
    }

    return user.is_admin || user.is_personal
  }
}
