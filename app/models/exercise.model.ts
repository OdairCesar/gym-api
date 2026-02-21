import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Exercise extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare reps: string

  @column()
  declare type: 'aerobico' | 'funcional' | 'musculacao' | 'flexibilidade' | 'outro'

  @column()
  declare weight: number

  @column()
  declare rest_seconds: number

  @column()
  declare video_link: string | null

  @column()
  declare priority: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null
}
