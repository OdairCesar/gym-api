import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Training from './training.js'
import Diet from './diet.js'
import Gym from './gym.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.date({ columnName: 'birth_date' })
  declare birth_date: DateTime | null

  @column()
  declare phone: string | null

  @column()
  declare cpf: string | null

  @column()
  declare gender: 'M' | 'F' | 'O' | null

  @column()
  declare profession: string | null

  @column()
  declare address: string | null

  @column()
  declare gym_id: number

  @column()
  declare diet_id: number | null

  @column({ columnName: 'is_admin' })
  declare is_admin: boolean

  @column({ columnName: 'is_personal' })
  declare is_personal: boolean

  @column({ columnName: 'is_super' })
  declare is_super: boolean

  @column()
  declare approved: boolean

  @column()
  declare approved_by: number | null

  @column.dateTime({ columnName: 'approved_at' })
  declare approved_at: DateTime | null

  @column()
  declare published: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Gym, { foreignKey: 'gym_id' })
  declare gym: BelongsTo<typeof Gym>

  @belongsTo(() => Diet, { foreignKey: 'diet_id' })
  declare diet: BelongsTo<typeof Diet>

  @belongsTo(() => User, { foreignKey: 'approved_by' })
  declare approver: BelongsTo<typeof User>

  @hasMany(() => Training, { foreignKey: 'user_id' })
  declare trainings: HasMany<typeof Training>

  @hasMany(() => Training, { foreignKey: 'coach_id' })
  declare createdTrainings: HasMany<typeof Training>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  /**
   * Helper methods para verificação de permissões
   */

  /**
   * Verifica se o usuário é um usuário comum (sem privilégios especiais)
   */
  isCommonUser(): boolean {
    return !this.is_admin && !this.is_personal && !this.is_super
  }

  /**
   * Verifica se o usuário pode fazer login (está aprovado)
   */
  canLogin(): boolean {
    // Super users sempre podem fazer login
    if (this.is_super) {
      return true
    }
    // Outros usuários precisam estar aprovados
    return this.approved
  }

  /**
   * Verifica se pode editar um recurso baseado no creator_id
   */
  canEditResource(creatorId: number | null): boolean {
    if (this.is_admin) {
      return true
    }

    if (this.is_personal && creatorId === this.id) {
      return true
    }

    return false
  }

  /**
   * Verifica se pode editar outro usuário
   */
  canEditUser(targetUser: User): boolean {
    if (this.is_admin) {
      return true
    }

    if (this.is_personal) {
      return !targetUser.is_admin && !targetUser.is_personal
    }

    return false
  }

  /**
   * Retorna o tipo de usuário como string
   */
  getUserType(): 'super' | 'admin' | 'personal' | 'user' {
    if (this.is_super) return 'super'
    if (this.is_admin) return 'admin'
    if (this.is_personal) return 'personal'
    return 'user'
  }

  /**
   * Verifica se o usuário pertence à mesma academia que outro usuário
   */
  isInSameGym(otherUser: User): boolean {
    return this.gym_id === otherUser.gym_id
  }

  /**
   * Verifica se o usuário pertence a uma academia específica
   */
  belongsToGym(gymId: number): boolean {
    return this.gym_id === gymId
  }

  /**
   * Verifica se pode editar um recurso considerando multi-tenant
   * - Supers podem editar tudo
   * - Admins podem editar tudo da sua academia
   * - Personals podem editar recursos que criaram na sua academia
   */
  canEditResourceInGym(creatorId: number | null, resourceGymId: number): boolean {
    // Super pode editar tudo
    if (this.is_super) {
      return true
    }

    // Precisa ser da mesma academia ou ter permissões especiais
    if (resourceGymId !== this.gym_id) {
      return false
    }

    if (this.is_admin) {
      return true
    }

    if (this.is_personal && creatorId === this.id) {
      return true
    }

    return false
  }

  /**
   * Verifica se pode editar outro usuário considerando multi-tenant
   * - Supers podem editar qualquer usuário
   * - Só pode editar usuários da mesma academia
   * - Admins podem editar qualquer um da sua academia
   * - Personals podem editar apenas users comuns da sua academia
   */
  canEditUserInGym(targetUser: User): boolean {
    // Super pode editar qualquer um
    if (this.is_super) {
      return true
    }

    // Precisa ser da mesma academia
    if (!this.isInSameGym(targetUser)) {
      return false
    }

    if (this.is_admin) {
      return true
    }

    if (this.is_personal) {
      return !targetUser.is_admin && !targetUser.is_personal
    }

    return false
  }
}
