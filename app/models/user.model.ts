import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Training from './training.model.js'
import Diet from './diet.model.js'
import Gym from './gym.model.js'

export const UserRole = {
  SUPER: 'super',
  ADMIN: 'admin',
  PERSONAL: 'personal',
  USER: 'user',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

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

  @column()
  declare role: UserRole

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
   * Verifica se o usuário pode fazer login (está aprovado)
   * Super sempre pode; outros precisam estar aprovados.
   */
  canLogin(): boolean {
    if (this.role === UserRole.SUPER) return true
    return this.approved
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
}
