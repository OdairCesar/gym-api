import User from '#models/user'
import Training from '#models/training'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import PermissionService from '#services/permission_service'

export default class TrainingPolicy extends BasePolicy {
  /**
   * Usuários podem ver lista de treinos (filtrado por gym_id no controller)
   */
  index(_user: User): AuthorizerResponse {
    return true
  }

  /**
   * Usuários podem ver treinos:
   * - Da sua academia
   * - Seus próprios treinos (user_id)
   * - Treinos que criaram como coach (coach_id)
   * - Admins podem ver todos da sua academia
   */
  show(user: User, training: Training): AuthorizerResponse {
    // Admin pode ver todos da sua academia
    if (user.is_admin && user.gym_id === training.gym_id) {
      return true
    }

    // Se é da mesma academia, pode ver
    if (user.gym_id === training.gym_id) {
      return true
    }

    // Se é o usuário do treino, pode ver
    if (training.user_id === user.id) {
      return true
    }

    // Se é o coach do treino, pode ver
    if (training.coach_id === user.id) {
      return true
    }

    return false
  }

  /**
   * Apenas admins e personals podem criar treinos (na sua academia)
   */
  create(user: User): AuthorizerResponse {
    return user.is_admin || user.is_personal
  }

  /**
   * Regras para atualizar treino (MULTI-TENANT + CROSS-TENANT):
   * - Admins podem atualizar qualquer treino DA SUA ACADEMIA
   * - Personals podem atualizar treinos que criaram (coach_id)
   * - Personals podem editar treinos de outras academias SE:
   *   1. A academia deu permissão ao personal
   *   2. O usuário específico deu permissão
   */
  async update(user: User, training: Training): Promise<AuthorizerResponse> {
    // Admin pode atualizar qualquer treino da sua academia
    if (user.is_admin && user.gym_id === training.gym_id) {
      return true
    }

    // Personal não pode editar treinos
    if (!user.is_personal) {
      return false
    }

    // Se é o coach do treino, pode editar
    if (training.coach_id === user.id) {
      return true
    }

    // Se é da mesma academia, pode editar
    if (user.gym_id === training.gym_id) {
      return true
    }

    // Verifica permissões cross-tenant
    return await PermissionService.canEditTraining(user, training)
  }

  /**
   * Regras para deletar treino (mesmas regras do update)
   */
  async delete(user: User, training: Training): Promise<AuthorizerResponse> {
    return await this.update(user, training)
  }
}
