import { inject } from '@adonisjs/core'
import User, { UserRole } from '#models/user'
import Diet from '#models/diet'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import PermissionService from '#services/permission_service'

@inject()
export default class DietPolicy extends BasePolicy {
  constructor(protected permissionService: PermissionService) {
    super()
  }

  index(_user: User): AuthorizerResponse {
    return true
  }

  show(_user: User, _diet: Diet): AuthorizerResponse {
    return true
  }

  create(user: User): AuthorizerResponse {
    return user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL
  }

  async update(user: User, diet: Diet): Promise<AuthorizerResponse> {
    if (user.role === UserRole.SUPER) return true
    return await this.permissionService.canEditDiet(user, diet)
  }

  async delete(user: User, diet: Diet): Promise<AuthorizerResponse> {
    return await this.update(user, diet)
  }
}
