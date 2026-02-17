import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Gym from './gym.js'
import User from './user.js'

export default class GymPermission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gym_id: number

  @column()
  declare personal_id: number

  @column({ columnName: 'can_edit_diets' })
  declare can_edit_diets: boolean

  @column({ columnName: 'can_edit_trainings' })
  declare can_edit_trainings: boolean

  @column({ columnName: 'is_active' })
  declare is_active: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updated_at: DateTime

  @belongsTo(() => Gym, { foreignKey: 'gym_id' })
  declare gym: BelongsTo<typeof Gym>

  @belongsTo(() => User, { foreignKey: 'personal_id' })
  declare personal: BelongsTo<typeof User>
}
