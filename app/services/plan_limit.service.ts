import { inject } from '@adonisjs/core'
import Gym from '#models/gym.model'
import User from '#models/user.model'

interface CanAddUserResult {
  allowed: boolean
  current: number
  max: number | null
}

@inject()
export default class PlanLimitService {
  /**
   * Verifica se a academia pode adicionar um novo usuário baseado no limite do plano
   */
  async canAddUser(gymId: number): Promise<CanAddUserResult> {
    // Buscar academia com subscription e plano
    const gym = await this.getGymWithPlan(gymId)

    // Se não tem subscription ativa, bloquear
    if (!gym.currentSubscription || !gym.currentSubscription.isActive()) {
      return {
        allowed: false,
        current: 0,
        max: 0,
      }
    }

    const plan = gym.currentSubscription.gymPlan
    const maxUsers = plan.maxUsers
    const currentUsers = await this.countUsers(gymId)

    // Se max_users é null, é ilimitado
    if (maxUsers === null) {
      return {
        allowed: true,
        current: currentUsers,
        max: null,
      }
    }

    return {
      allowed: currentUsers < maxUsers,
      current: currentUsers,
      max: maxUsers,
    }
  }

  /**
   * Conta o número total de usuários de uma academia
   */
  private async countUsers(gymId: number): Promise<number> {
    const result = await User.query().where('gym_id', gymId).count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Busca academia com subscription e plano carregados
   */
  private async getGymWithPlan(gymId: number): Promise<Gym> {
    return await Gym.query()
      .where('id', gymId)
      .preload('currentSubscription', (query) => {
        query.preload('gymPlan')
      })
      .firstOrFail()
  }

  /**
   * Métodos futuros preparados para expansão de features
   */

  // async canAddTrainer(gymId: number): Promise<boolean> {
  //   const gym = await this.getGymWithPlan(gymId)
  //   const plan = gym.currentSubscription?.gymPlan
  //   if (!plan) return false
  //
  //   const maxTrainers = plan.getFeature<number>('max_trainers')
  //   if (!maxTrainers) return true // Sem limite
  //
  //   const currentTrainers = await User.query()
  //     .where('gym_id', gymId)
  //     .whereIn('role', ['admin', 'personal'])
  //     .count('* as total')
  //
  //   return Number(currentTrainers[0].$extras.total) < maxTrainers
  // }

  // async canExportReports(gymId: number): Promise<boolean> {
  //   const gym = await this.getGymWithPlan(gymId)
  //   const plan = gym.currentSubscription?.gymPlan
  //   if (!plan) return false
  //
  //   return plan.hasFeature('can_export_reports')
  // }

  // async hasFeature(gymId: number, featureName: string): Promise<boolean> {
  //   const gym = await this.getGymWithPlan(gymId)
  //   const plan = gym.currentSubscription?.gymPlan
  //   if (!plan) return false
  //
  //   return plan.hasFeature(featureName)
  // }

  // async getFeatureValue<T>(gymId: number, featureName: string): Promise<T | null> {
  //   const gym = await this.getGymWithPlan(gymId)
  //   const plan = gym.currentSubscription?.gymPlan
  //   if (!plan) return null
  //
  //   return plan.getFeature<T>(featureName, null)
  // }
}
