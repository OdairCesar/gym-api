import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Diet from './diet.js'
import Training from './training.js'
import Product from './product.js'

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
}
