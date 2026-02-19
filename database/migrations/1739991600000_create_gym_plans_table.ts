import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gym_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.decimal('price', 10, 2).notNullable().defaultTo(0)
      table.integer('max_users').nullable()
      table.json('features').nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
