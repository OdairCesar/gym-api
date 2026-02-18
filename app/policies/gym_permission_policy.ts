import User, { UserRole } from '#models/user'
import GymPermission from '#models/gym_permission'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class GymPermissionPolicy extends BasePolicy {
  /** Admins veem apenas as permissões da sua academia */
  index(user: User): AuthorizerResponse {
    return user.role === UserRole.SUPER || user.role === UserRole.ADMIN
  }

  show(user: User, permission: GymPermission): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN && user.gym_id === permission.gym_id
  }

  /** Admin concede acesso a um personal externo */
  create(user: User): AuthorizerResponse {
    return user.role === UserRole.SUPER || user.role === UserRole.ADMIN
  }

  update(user: User, permission: GymPermission): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return user.role === UserRole.ADMIN && user.gym_id === permission.gym_id
  }

  delete(user: User, permission: GymPermission): AuthorizerResponse {
    return this.update(user, permission)
  }

  /** Apenas personals consultam as academias que os autorizaram */
  viewMyPermissions(user: User): AuthorizerResponse {
    return user.role === UserRole.SUPER || user.role === UserRole.PERSONAL
  }
}
