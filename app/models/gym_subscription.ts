import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Gym from './gym.js'
import GymPlan from './gym_plan.js'
import type { SubscriptionStatus } from '#types/subscription_types'

export default class GymSubscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gymId: number

  @column()
  declare gymPlanId: number

  @column()
  declare status: SubscriptionStatus

  @column()
  declare paymentMethod: string

  @column()
  declare paymentProvider: string | null

  @column()
  declare paymentProviderId: string | null

  @column({
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare paymentMetadata: Record<string, any> | null

  @column.dateTime()
  declare currentPeriodStart: DateTime

  @column.dateTime()
  declare currentPeriodEnd: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Gym, { foreignKey: 'gymId' })
  declare gym: BelongsTo<typeof Gym>

  @belongsTo(() => GymPlan, { foreignKey: 'gymPlanId' })
  declare gymPlan: BelongsTo<typeof GymPlan>

  // Helper methods
  isActive(): boolean {
    return this.status === 'active'
  }

  isCancelled(): boolean {
    return this.status === 'cancelled'
  }

  isPastDue(): boolean {
    return this.status === 'past_due'
  }

  isFree(): boolean {
    return this.paymentMethod === 'free'
  }
}
