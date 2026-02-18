import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class UserPermission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column({ columnName: 'grantee_type' })
  declare grantee_type: 'gym' | 'personal'

  @column({ columnName: 'grantee_id' })
  declare grantee_id: number

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

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>
}
