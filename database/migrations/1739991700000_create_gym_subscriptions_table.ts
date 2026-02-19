import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gym_subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('gym_id').unsigned().references('id').inTable('gyms').onDelete('CASCADE')
      table
        .integer('gym_plan_id')
        .unsigned()
        .references('id')
        .inTable('gym_plans')
        .notNullable()
      table
        .enum('status', ['active', 'cancelled', 'past_due'])
        .defaultTo('active')
        .notNullable()
      table.string('payment_method').notNullable().defaultTo('free')
      table.string('payment_provider').nullable()
      table.string('payment_provider_id').nullable()
      table.json('payment_metadata').nullable()
      table.timestamp('current_period_start').notNullable()
      table.timestamp('current_period_end').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
