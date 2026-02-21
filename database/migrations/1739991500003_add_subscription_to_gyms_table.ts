import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gyms'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('current_subscription_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('gymsubscriptions')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('current_subscription_id')
    })
  }
}
