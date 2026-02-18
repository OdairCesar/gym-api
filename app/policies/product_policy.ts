import User, { UserRole } from '#models/user'
import Product from '#models/product'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ProductPolicy extends BasePolicy {
  index(_user: User): AuthorizerResponse {
    return true
  }

  show(user: User, product: Product): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.gym_id === product.gym_id
  }

  create(user: User): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL
  }

  update(user: User, product: Product): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    if (user.gym_id !== product.gym_id) return false
    return user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL
  }

  delete(user: User, product: Product): AuthorizerResponse {
    return this.update(user, product)
  }
}
