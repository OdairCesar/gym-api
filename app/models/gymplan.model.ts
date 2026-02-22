import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Gymplan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare price: number

  @column()
  declare maxUsers: number | null

  @column({
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare features: Record<string, any> | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Helper methods
  hasFeature(key: string): boolean {
    if (!this.features) return false
    return key in this.features && this.features[key] !== false && this.features[key] !== null
  }

  getFeature<T = unknown>(key: string): T | undefined
  getFeature<T = unknown>(key: string, defaultValue: T): T
  getFeature<T = unknown>(key: string, defaultValue?: T): T | undefined {
    if (!this.features || !(key in this.features)) {
      return defaultValue
    }
    return this.features[key] as T
  }

  isPlanActive(): boolean {
    return this.isActive === true
  }

  isFree(): boolean {
    return this.price === 0
  }

  hasUserLimit(): boolean {
    return this.maxUsers !== null
  }
}
