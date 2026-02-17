import User from '#models/user'
import Diet from '#models/diet'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import PermissionService from '#services/permission_service'

export default class DietPolicy extends BasePolicy {
  /**
   * Usuários podem ver lista de dietas (filtrado por gym_id no controller)
   */
  index(_user: User): AuthorizerResponse {
    return true
  }

  /**
   * Usuários podem ver dietas da sua academia
   * Personals podem ver dietas de outras academias se tiverem permissão
   */
  show(user: User, diet: Diet): AuthorizerResponse {
    // Admin pode ver tudo da sua academia
    if (user.is_admin && user.gym_id === diet.gym_id) {
      return true
    }

    // Se é da mesma academia, pode ver
    if (user.gym_id === diet.gym_id) {
      return true
    }

    // Verificação de permissão cross-tenant será feita no controller
    return false
  }

  /**
   * Apenas admins e personals podem criar dietas (na sua academia)
   */
  create(user: User): AuthorizerResponse {
    return user.is_admin || user.is_personal
  }

  /**
   * Regras para atualizar dieta (MULTI-TENANT + CROSS-TENANT):
   * - Admins podem atualizar qualquer dieta DA SUA ACADEMIA
   * - Personals podem atualizar dietas que criaram
   * - Personals podem editar dietas de outras academias SE:
   *   1. A academia deu permissão ao personal
   *   2. Um usuário específico deu permissão
   */
  async update(user: User, diet: Diet): Promise<AuthorizerResponse> {
    // Admin pode atualizar qualquer dieta da sua academia
    if (user.is_admin && user.gym_id === diet.gym_id) {
      return true
    }

    // Personal não pode editar dietas
    if (!user.is_personal) {
      return false
    }

    // Se criou a dieta, pode editar
    if (diet.creator_id === user.id) {
      return true
    }

    // Se é da mesma academia, pode editar
    if (user.gym_id === diet.gym_id) {
      return true
    }

    // Verifica permissões cross-tenant
    return await PermissionService.canEditDiet(user, diet)
  }

  /**
   * Regras para deletar dieta (mesmas regras do update)
   */
  async delete(user: User, diet: Diet): Promise<AuthorizerResponse> {
    return await this.update(user, diet)
  }
}
