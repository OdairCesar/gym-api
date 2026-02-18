import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Exercise from './exercise.js'
import Gym from './gym.js'

export default class Training extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare coach_id: number

  @column()
  declare gym_id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare is_reusable: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime | null

  @belongsTo(() => Gym, { foreignKey: 'gym_id' })
  declare gym: BelongsTo<typeof Gym>

  @belongsTo(() => User, { foreignKey: 'coach_id' })
  declare coach: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Exercise, {
    pivotTable: 'training_exercise',
    pivotColumns: ['name', 'reps', 'type', 'weight', 'rest_seconds', 'video_link', 'priority'],
  })
  declare exercises: ManyToMany<typeof Exercise>
}
