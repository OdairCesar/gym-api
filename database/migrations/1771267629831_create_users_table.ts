import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.date('birth_date').nullable()
      table.string('phone', 20).nullable()
      table.string('cpf', 11).nullable().unique()
      table.enum('gender', ['M', 'F', 'O']).nullable()
      table.string('profession').nullable()
      table.text('address').nullable()
      table.enum('role', ['super', 'admin', 'personal', 'user']).notNullable().defaultTo('user')
      table.boolean('approved').notNullable().defaultTo(false)
      table.integer('approved_by').unsigned().nullable()
      table.timestamp('approved_at').nullable()
      table.boolean('published').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
