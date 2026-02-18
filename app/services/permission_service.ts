import { inject } from '@adonisjs/core'
import User, { UserRole } from '#models/user'
import Diet from '#models/diet'
import Training from '#models/training'
import GymPermission from '#models/gym_permission'
import UserPermission from '#models/user_permission'
import db from '@adonisjs/lucid/services/db'

export const ResourceType = {
  DIET: 'diet',
  TRAINING: 'training',
  EXERCISE: 'exercise',
} as const
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]

@inject()
export default class PermissionService {
  /** Cache de permissões por request — descartado automaticamente ao fim do request */
  readonly #cache = new Map<string, boolean>()

  #cacheGet(key: string): boolean | undefined {
    return this.#cache.get(key)
  }

  #cacheSet(key: string, value: boolean): boolean {
    this.#cache.set(key, value)
    return value
  }
  // ---------------------------------------------------------------------------
  // Permissões de academia (GymPermission)
  // ---------------------------------------------------------------------------

  async personalHasGymPermissionForDiets(personalId: number, gymId: number): Promise<boolean> {
    const key = `gymPerm:diets:${personalId}:${gymId}`
    const cached = this.#cacheGet(key)
    if (cached !== undefined) return cached

    const permission = await GymPermission.query()
      .where('personal_id', personalId)
      .where('gym_id', gymId)
      .where('can_edit_diets', true)
      .where('is_active', true)
      .first()

    return this.#cacheSet(key, !!permission)
  }

  async personalHasGymPermissionForTrainings(personalId: number, gymId: number): Promise<boolean> {
    const key = `gymPerm:trainings:${personalId}:${gymId}`
    const cached = this.#cacheGet(key)
    if (cached !== undefined) return cached

    const permission = await GymPermission.query()
      .where('personal_id', personalId)
      .where('gym_id', gymId)
      .where('can_edit_trainings', true)
      .where('is_active', true)
      .first()

    return this.#cacheSet(key, !!permission)
  }

  // ---------------------------------------------------------------------------
  // canEditDiet — com fix N+1: batch query no lugar do loop
  // ---------------------------------------------------------------------------

  async canEditDiet(personal: User, diet: Diet): Promise<boolean> {
    const key = `canEditDiet:${personal.id}:${diet.id}`
    const cached = this.#cacheGet(key)
    if (cached !== undefined) return cached

    return this.#cacheSet(key, await this.#computeCanEditDiet(personal, diet))
  }

  async #computeCanEditDiet(personal: User, diet: Diet): Promise<boolean> {
    if (personal.role === UserRole.SUPER) return true
    if (personal.role === UserRole.ADMIN) return personal.gym_id === diet.gym_id
    if (personal.role !== UserRole.PERSONAL) return false

    if (diet.creator_id === personal.id) return true
    if (diet.gym_id === personal.gym_id) return true

    const hasGymPermission = await this.personalHasGymPermissionForDiets(personal.id, diet.gym_id)
    if (hasGymPermission) return true

    // Batch: 1 query no lugar do loop com N queries
    await diet.load('users')
    const userIds = (diet.users ?? []).map((u) => u.id)
    if (userIds.length === 0) return false

    const granted = await UserPermission.query()
      .whereIn('user_id', userIds)
      .where((q) => {
        q.where((q1) => {
          q1.where('grantee_type', 'personal').where('grantee_id', personal.id)
        }).orWhere((q2) => {
          q2.where('grantee_type', 'gym').where('grantee_id', personal.gym_id)
        })
      })
      .where('can_edit_diets', true)
      .where('is_active', true)
      .first()

    return !!granted
  }

  // ---------------------------------------------------------------------------
  // canEditTraining — 1 query com OR no lugar de 2 queries sequenciais
  // ---------------------------------------------------------------------------

  async canEditTraining(personal: User, training: Training): Promise<boolean> {
    const key = `canEditTraining:${personal.id}:${training.id}`
    const cached = this.#cacheGet(key)
    if (cached !== undefined) return cached

    return this.#cacheSet(key, await this.#computeCanEditTraining(personal, training))
  }

  async #computeCanEditTraining(personal: User, training: Training): Promise<boolean> {
    if (personal.role === UserRole.SUPER) return true
    if (personal.role === UserRole.ADMIN) return personal.gym_id === training.gym_id
    if (personal.role !== UserRole.PERSONAL) return false

    if (training.coach_id === personal.id) return true
    if (training.gym_id === personal.gym_id) return true

    const hasGymPermission = await this.personalHasGymPermissionForTrainings(
      personal.id,
      training.gym_id
    )
    if (hasGymPermission) return true

    const granted = await UserPermission.query()
      .where('user_id', training.user_id)
      .where((q) => {
        q.where((q1) => {
          q1.where('grantee_type', 'personal').where('grantee_id', personal.id)
        }).orWhere((q2) => {
          q2.where('grantee_type', 'gym').where('grantee_id', personal.gym_id)
        })
      })
      .where('can_edit_trainings', true)
      .where('is_active', true)
      .first()

    return !!granted
  }

  // ---------------------------------------------------------------------------
  // Versões por ID
  // ---------------------------------------------------------------------------

  async canEditDietById(personalId: number, dietId: number): Promise<boolean> {
    const personal = await User.findOrFail(personalId)
    const diet = await Diet.findOrFail(dietId)
    return this.canEditDiet(personal, diet)
  }

  async canEditTrainingById(personalId: number, trainingId: number): Promise<boolean> {
    const personal = await User.findOrFail(personalId)
    const training = await Training.findOrFail(trainingId)
    return this.canEditTraining(personal, training)
  }

  // ---------------------------------------------------------------------------
  // hasFullAccessToResource — com cache
  // ---------------------------------------------------------------------------

  async hasFullAccessToResource(
    user: User,
    resourceType: ResourceType,
    resourceId: number,
    resourceGymId?: number
  ): Promise<boolean> {
    const key = `fullAccess:${resourceType}:${resourceId}:${user.id}`
    const cached = this.#cacheGet(key)
    if (cached !== undefined) return cached

    return this.#cacheSet(
      key,
      await this.#computeFullAccess(user, resourceType, resourceId, resourceGymId)
    )
  }

  async #computeFullAccess(
    user: User,
    resourceType: ResourceType,
    resourceId: number,
    resourceGymId?: number
  ): Promise<boolean> {
    if (user.role === UserRole.SUPER) return true

    if (resourceType === ResourceType.EXERCISE) {
      return user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL
    }

    if (resourceType === ResourceType.DIET) {
      if (user.role === UserRole.ADMIN) return user.gym_id === resourceGymId
      if (user.role === UserRole.PERSONAL) return this.canEditDietById(user.id, resourceId)
      return user.diet_id === resourceId
    }

    if (resourceType === ResourceType.TRAINING) {
      if (user.role === UserRole.ADMIN) return user.gym_id === resourceGymId
      if (user.role === UserRole.PERSONAL) return this.canEditTrainingById(user.id, resourceId)
      const training = await Training.find(resourceId)
      return training?.user_id === user.id
    }

    return false
  }

  // ---------------------------------------------------------------------------
  // getFullAccessResourceIds — batch (evita N+1 nos endpoints de listagem)
  // ---------------------------------------------------------------------------

  async getFullAccessResourceIds(
    user: User,
    resourceType: ResourceType,
    resources: {
      id: number
      gym_id?: number
      user_id?: number
      coach_id?: number
      creator_id?: number | null
    }[]
  ): Promise<Set<number>> {
    const fullAccessIds = new Set<number>()

    if (user.role === UserRole.SUPER) {
      resources.forEach((r) => fullAccessIds.add(r.id))
      return fullAccessIds
    }

    if (resourceType === ResourceType.EXERCISE) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.PERSONAL) {
        resources.forEach((r) => fullAccessIds.add(r.id))
      }
      return fullAccessIds
    }

    if (user.role === UserRole.ADMIN) {
      resources.filter((r) => r.gym_id === user.gym_id).forEach((r) => fullAccessIds.add(r.id))
      return fullAccessIds
    }

    if (resourceType === ResourceType.DIET) {
      if (user.role === UserRole.PERSONAL) {
        resources.filter((r) => r.creator_id === user.id).forEach((r) => fullAccessIds.add(r.id))

        const permittedGymIds = await this.getGymsWithPermissionForPersonal(user.id, 'diets')
        const permittedGymSet = new Set(permittedGymIds)

        resources
          .filter((r) => r.gym_id === user.gym_id || permittedGymSet.has(r.gym_id!))
          .forEach((r) => fullAccessIds.add(r.id))
      } else {
        if (user.diet_id) fullAccessIds.add(user.diet_id)
      }
    }

    if (resourceType === ResourceType.TRAINING) {
      if (user.role === UserRole.PERSONAL) {
        resources.filter((r) => r.coach_id === user.id).forEach((r) => fullAccessIds.add(r.id))

        const permittedGymIds = await this.getGymsWithPermissionForPersonal(user.id, 'trainings')
        const permittedGymSet = new Set(permittedGymIds)

        resources
          .filter((r) => r.gym_id === user.gym_id || permittedGymSet.has(r.gym_id!))
          .forEach((r) => fullAccessIds.add(r.id))
      } else {
        resources.filter((r) => r.user_id === user.id).forEach((r) => fullAccessIds.add(r.id))
      }
    }

    return fullAccessIds
  }

  // ---------------------------------------------------------------------------
  // Listagens
  // ---------------------------------------------------------------------------

  async getGymsWithPermissionForPersonal(
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

  async getGymsWithPermissions(personalId: number) {
    return await db
      .from('gym_permissions')
      .join('gyms', 'gyms.id', 'gym_permissions.gym_id')
      .where('gym_permissions.personal_id', personalId)
      .where('gym_permissions.is_active', true)
      .select('gyms.*', 'gym_permissions.can_edit_diets', 'gym_permissions.can_edit_trainings')
  }

  async getPersonalsWithPermissions(gymId: number) {
    return await db
      .from('gym_permissions')
      .join('users', 'users.id', 'gym_permissions.personal_id')
      .where('gym_permissions.gym_id', gymId)
      .where('gym_permissions.is_active', true)
      .select('users.*', 'gym_permissions.can_edit_diets', 'gym_permissions.can_edit_trainings')
  }

  async getUserGrantedPermissions(userId: number) {
    return await UserPermission.query().where('user_id', userId).where('is_active', true)
  }
}
