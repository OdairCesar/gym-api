import { inject } from '@adonisjs/core'
import User, { UserRole } from '#models/user'
import Training from '#models/training'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import PermissionService from '#services/permission_service'

@inject()
export default class TrainingPolicy extends BasePolicy {
  constructor(protected permissionService: PermissionService) {
    super()
  }

  index(_user: User): AuthorizerResponse {
    return true
  }

  show(_user: User, _training: Training): AuthorizerResponse {
    return true
  }

  create(user: User): AuthorizerResponse {
    return user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL
  }

  async update(user: User, training: Training): Promise<AuthorizerResponse> {
    if (user.role === UserRole.SUPER) return true
    return await this.permissionService.canEditTraining(user, training)
  }

  async delete(user: User, training: Training): Promise<AuthorizerResponse> {
    return await this.update(user, training)
  }
}
