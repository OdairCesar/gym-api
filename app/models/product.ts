import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Gym from './gym.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare stock: number

  @column()
  declare image_link: string | null

  @column()
  declare category: string | null

  @column()
  declare code: string | null

  @column()
  declare gym_id: number

  @column()
  declare published: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Gym, { foreignKey: 'gym_id' })
  declare gym: BelongsTo<typeof Gym>
}
