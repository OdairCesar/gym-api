import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Diet from './diet.model.js'
import Food from './food.model.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Meal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare hourly: string | null

  @column()
  declare diet_id: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Diet, { foreignKey: 'diet_id' })
  declare diet: BelongsTo<typeof Diet>

  @hasMany(() => Food, { foreignKey: 'meal_id' })
  declare foods: HasMany<typeof Food>
}
