import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Meal from './meal.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Food extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare meal_id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Meal, { foreignKey: 'meal_id' })
  declare meal: BelongsTo<typeof Meal>
}
