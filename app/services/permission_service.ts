import User from '#models/user'
import Diet from '#models/diet'
import Training from '#models/training'
import GymPermission from '#models/gym_permission'
import UserPermission from '#models/user_permission'
import db from '@adonisjs/lucid/services/db'

export default class PermissionService {
  /**
   * Verifica se um personal tem permissão de uma academia para editar dietas
   */
  static async personalHasGymPermissionForDiets(
    personalId: number,
    gymId: number
  ): Promise<boolean> {
    const permission = await GymPermission.query()
      .where('personal_id', personalId)
      .where('gym_id', gymId)
      .where('can_edit_diets', true)
      .where('is_active', true)
      .first()

    return !!permission
  }

  /**
   * Verifica se um personal tem permissão de uma academia para editar treinos
   */
  static async personalHasGymPermissionForTrainings(
    personalId: number,
    gymId: number
  ): Promise<boolean> {
    const permission = await GymPermission.query()
      .where('personal_id', personalId)
      .where('gym_id', gymId)
      .where('can_edit_trainings', true)
      .where('is_active', true)
      .first()

    return !!permission
  }

  /**
   * Verifica se uma academia ou personal tem permissão do usuário para editar sua dieta
   */
  static async hasUserPermissionForDiet(
    userId: number,
    granteeType: 'gym' | 'personal',
    granteeId: number
  ): Promise<boolean> {
    const permission = await UserPermission.query()
      .where('user_id', userId)
      .where('grantee_type', granteeType)
      .where('grantee_id', granteeId)
      .where('can_edit_diet', true)
      .where('is_active', true)
      .first()

    return !!permission
  }

  /**
   * Verifica se uma academia ou personal tem permissão do usuário para editar seu treino
   */
  static async hasUserPermissionForTraining(
    userId: number,
    granteeType: 'gym' | 'personal',
    granteeId: number
  ): Promise<boolean> {
    const permission = await UserPermission.query()
      .where('user_id', userId)
      .where('grantee_type', granteeType)
      .where('grantee_id', granteeId)
      .where('can_edit_training', true)
      .where('is_active', true)
      .first()

    return !!permission
  }

  /**
   * Verifica se um personal pode editar uma dieta específica
   * Considera:
   * - Se está na mesma academia
   * - Se tem permissão da academia (cross-tenant)
   * - Se tem permissão do usuário específico
   */
  static async canEditDiet(personal: User, diet: Diet): Promise<boolean> {
    // Admin pode tudo
    if (personal.is_admin) {
      return true
    }

    // Não é personal nem admin, não pode editar
    if (!personal.is_personal) {
      return false
    }

    // Se criou a dieta, pode editar
    if (diet.creator_id === personal.id) {
      return true
    }

    // Carrega informações da dieta se necessário
    await diet.load('gym')
    await diet.load('users')

    const dietGymId = diet.gym_id
    const personalGymId = personal.gym_id

    // 1. Se está na mesma academia, pode editar
    if (dietGymId === personalGymId) {
      return true
    }

    // 2. Verifica se tem permissão da academia da dieta
    const hasGymPermission = await this.personalHasGymPermissionForDiets(personal.id, dietGymId)
    if (hasGymPermission) {
      return true
    }

    // 3. Verifica se algum usuário com essa dieta deu permissão específica
    const usersWithDiet = diet.users || []
    for (const user of usersWithDiet) {
      // Permissão direta para o personal
      const hasPersonalPermission = await this.hasUserPermissionForDiet(
        user.id,
        'personal',
        personal.id
      )
      if (hasPersonalPermission) {
        return true
      }

      // Permissão para a academia do personal
      const hasGymPermissionFromUser = await this.hasUserPermissionForDiet(
        user.id,
        'gym',
        personalGymId
      )
      if (hasGymPermissionFromUser) {
        return true
      }
    }

    return false
  }

  /**
   * Verifica se um personal pode editar um treino específico
   * Considera:
   * - Se está na mesma academia
   * - Se é o coach do treino
   * - Se tem permissão da academia (cross-tenant)
   * - Se tem permissão do usuário específico
   */
  static async canEditTraining(personal: User, training: Training): Promise<boolean> {
    // Admin pode tudo
    if (personal.is_admin) {
      return true
    }

    // Não é personal nem admin, não pode editar
    if (!personal.is_personal) {
      return false
    }

    // Se é o coach do treino, pode editar
    if (training.coach_id === personal.id) {
      return true
    }

    // Carrega informações do treino se necessário
    await training.load('gym')
    await training.load('user')

    const trainingGymId = training.gym_id
    const personalGymId = personal.gym_id
    const trainingUserId = training.user_id

    // 1. Se está na mesma academia, pode editar
    if (trainingGymId === personalGymId) {
      return true
    }

    // 2. Verifica se tem permissão da academia do treino
    const hasGymPermission = await this.personalHasGymPermissionForTrainings(
      personal.id,
      trainingGymId
    )
    if (hasGymPermission) {
      return true
    }

    // 3. Verifica se o usuário do treino deu permissão específica
    // Permissão direta para o personal
    const hasPersonalPermission = await this.hasUserPermissionForTraining(
      trainingUserId,
      'personal',
      personal.id
    )
    if (hasPersonalPermission) {
      return true
    }

    // Permissão para a academia do personal
    const hasGymPermissionFromUser = await this.hasUserPermissionForTraining(
      trainingUserId,
      'gym',
      personalGymId
    )
    if (hasGymPermissionFromUser) {
      return true
    }

    return false
  }

  /**
   * Lista todas as academias que deram permissão para um personal
   */
  static async getGymsWithPermissions(personalId: number) {
    return await db
      .from('gym_permissions')
      .join('gyms', 'gyms.id', 'gym_permissions.gym_id')
      .where('gym_permissions.personal_id', personalId)
      .where('gym_permissions.is_active', true)
      .select('gyms.*', 'gym_permissions.can_edit_diets', 'gym_permissions.can_edit_trainings')
  }

  /**
   * Lista todos os personals que têm permissão de uma academia
   */
  static async getPersonalsWithPermissions(gymId: number) {
    return await db
      .from('gym_permissions')
      .join('users', 'users.id', 'gym_permissions.personal_id')
      .where('gym_permissions.gym_id', gymId)
      .where('gym_permissions.is_active', true)
      .select('users.*', 'gym_permissions.can_edit_diets', 'gym_permissions.can_edit_trainings')
  }

  /**
   * Lista todas as permissões específicas concedidas por um usuário
   */
  static async getUserGrantedPermissions(userId: number) {
    return await UserPermission.query().where('user_id', userId).where('is_active', true)
  }

  /**
   * Retorna IDs das academias onde o personal tem permissão
   * @param personalId ID do personal
   * @param resource Tipo de recurso: 'diets' ou 'trainings'
   */
  static async getGymsWithPermissionForPersonal(
    personalId: number,
    resource: 'diets' | 'trainings'
  ): Promise<number[]> {
    const column = resource === 'diets' ? 'can_edit_diets' : 'can_edit_trainings'

    const permissions = await db
      .from('gym_permissions')
      .where('personal_id', personalId)
      .where(column, true)
      .where('is_active', true)
      .select('gym_id')

    return permissions.map((p) => p.gym_id)
  }

  /**
   * Verifica se um personal pode editar uma dieta usando IDs
   */
  static async canEditDietById(personalId: number, dietId: number): Promise<boolean> {
    const personal = await User.findOrFail(personalId)
    const diet = await Diet.findOrFail(dietId)

    return this.canEditDiet(personal, diet)
  }

  /**
   * Verifica se um personal pode editar um treino usando IDs
   */
  static async canEditTrainingById(personalId: number, trainingId: number): Promise<boolean> {
    const personal = await User.findOrFail(personalId)
    const training = await Training.findOrFail(trainingId)

    return this.canEditTraining(personal, training)
  }
}
