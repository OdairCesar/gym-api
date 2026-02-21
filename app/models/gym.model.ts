import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.model.js'
import Diet from './diet.model.js'
import Training from './training.model.js'
import Product from './product.model.js'
import Gymsubscription from './gymsubscription.model.js'

export default class Gym extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare cnpj: string | null

  @column()
  declare published: boolean

  @column()
  declare currentSubscriptionId: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime

  // Relacionamentos
  @hasMany(() => User, { foreignKey: 'gym_id' })
  declare users: HasMany<typeof User>

  @hasMany(() => Diet, { foreignKey: 'gym_id' })
  declare diets: HasMany<typeof Diet>

  @hasMany(() => Training, { foreignKey: 'gym_id' })
  declare trainings: HasMany<typeof Training>

  @hasMany(() => Product, { foreignKey: 'gym_id' })
  declare products: HasMany<typeof Product>

  @belongsTo(() => Gymsubscription, { foreignKey: 'currentSubscriptionId' })
  declare currentSubscription: BelongsTo<typeof Gymsubscription>

  @hasMany(() => Gymsubscription, { foreignKey: 'gymId' })
  declare subscriptions: HasMany<typeof Gymsubscription>
}
