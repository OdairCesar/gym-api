import User, { UserRole } from '#models/user.model'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserPolicy extends BasePolicy {
  index(_user: User): AuthorizerResponse {
    return true
  }

  show(user: User, targetUser: User): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.isInSameGym(targetUser)
  }

  create(user: User): AuthorizerResponse {
    return (
      user.role === UserRole.SUPER ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.PERSONAL
    )
  }

  update(user: User, targetUser: User): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    if (user.id === targetUser.id) return true
    if (!user.isInSameGym(targetUser)) return false
    if (user.role === UserRole.ADMIN) return true
    if (user.role === UserRole.PERSONAL) {
      return targetUser.role !== UserRole.ADMIN && targetUser.role !== UserRole.PERSONAL
    }
    return false
  }

  delete(user: User, targetUser: User): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    if (!user.isInSameGym(targetUser)) return false
    if (user.role === UserRole.ADMIN) return true
    if (user.role === UserRole.PERSONAL) {
      return targetUser.role !== UserRole.ADMIN && targetUser.role !== UserRole.PERSONAL
    }
    return false
  }
}
