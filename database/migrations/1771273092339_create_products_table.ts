import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.integer('stock').notNullable().defaultTo(0)
      table.string('category').nullable()
      table.string('image_link').nullable()
      table.string('code').nullable().unique()
      table.boolean('published').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
