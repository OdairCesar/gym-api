import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Meal from './meal.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Gym from './gym.js'

export default class Diet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare calories: number | null

  @column()
  declare proteins: number | null

  @column()
  declare carbohydrates: number | null

  @column()
  declare fats: number | null

  @column()
  declare gym_id: number

  @column()
  declare creator_id: number | null

  @column()
  declare is_reusable: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Gym, { foreignKey: 'gym_id' })
  declare gym: BelongsTo<typeof Gym>

  @belongsTo(() => User, { foreignKey: 'creator_id' })
  declare criador: BelongsTo<typeof User>

  @hasMany(() => Meal)
  declare meals: HasMany<typeof Meal>

  @hasMany(() => User, { foreignKey: 'diet_id' })
  declare users: HasMany<typeof User>
}
