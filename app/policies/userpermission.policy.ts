import User, { UserRole } from '#models/user.model'
import Userpermission from '#models/userpermission.model'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserpermissionPolicy extends BasePolicy {
  /** Cada cliente vê apenas as suas próprias permissões (filtro no controller) */
  index(_user: User): AuthorizerResponse {
    return true
  }

  show(user: User, permission: Userpermission): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return permission.user_id === user.id
  }

  /** Qualquer usuário autenticado pode conceder acesso a personal/academia */
  create(_user: User): AuthorizerResponse {
    return true
  }

  update(user: User, permission: Userpermission): AuthorizerResponse {
    if (user.role === UserRole.SUPER) return true
    return permission.user_id === user.id
  }

  delete(user: User, permission: Userpermission): AuthorizerResponse {
    return this.update(user, permission)
  }

  /** Personals e admins visualizam quem lhes concedeu permissão */
  grantedToMe(user: User): AuthorizerResponse {
    return (
      user.role === UserRole.SUPER ||
      user.role === UserRole.PERSONAL ||
      user.role === UserRole.ADMIN
    )
  }
}
